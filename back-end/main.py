import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import APIError, OpenAI

from LLmPrompt import START_PROMPT
from rag.chroma_store import ChromaConfig, ChromaStore
from rag.indexer import IndexConfig, Indexer, SUPPORTED_EXTENSIONS

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
PROJECT_ROOT = Path(__file__).resolve().parent
NOT_FOUND_MESSAGE = "Sorry I could not find any relative information"

app = FastAPI(title="Helping Chatbot Streaming API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse_event(event_name, data):
    return f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def is_not_found_answer(answer):
    normalized = " ".join(answer.strip().split()).lower().rstrip(".")
    return normalized == NOT_FOUND_MESSAGE.lower().rstrip(".")


def stream_text_chunks(text, chunk_size=120):
    for index in range(0, len(text), chunk_size):
        yield text[index : index + chunk_size]




def stream_chat_response(question, model):
    if not os.getenv("OPENAI_API_KEY"):
        yield sse_event("error", {"message": "OPENAI_API_KEY is not configured"})
        return

    start_time = time.time()

    persist_dir = PROJECT_ROOT / "chroma_db"
    embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    top_k = int(os.getenv("RAG_TOP_K", "6"))

    store = ChromaStore(ChromaConfig(persist_dir=persist_dir, collection_name="project_files"))
    if store.count() == 0:
        yield sse_event(
            "error",
            {"message": "Vector index is empty. Call POST /index/rebuild first."},
        )
        return

    try:
        q_embed = client.embeddings.create(model=embedding_model, input=[question]).data[0].embedding
        results = store.query(query_embedding=q_embed, top_k=top_k)
        docs = (results.get("documents") or [[]])[0] or []
        metas = (results.get("metadatas") or [[]])[0] or []
    except Exception as exc:
        yield sse_event("error", {"message": f"Failed to retrieve from vector DB: {exc}"})
        return

    retrieved = []
    for doc, meta in zip(docs, metas, strict=False):
        source = (meta or {}).get("source", "unknown")
        chunk_index = (meta or {}).get("chunk_index", -1)
        retrieved.append(
            {
                "source": source,
                "chunk_index": chunk_index,
                "text": (doc or "").strip(),
            }
        )

    data_parts = []
    for r in retrieved:
        if not r["text"]:
            continue
        data_parts.append(f"[FILE: {r['source']} | CHUNK: {r['chunk_index']}]\n{r['text']}")
    data_payload = "\n\n".join(data_parts).strip()

    yield sse_event(
        "start",
        {
            "files_dir": "files/",
            "chunk_count": len(retrieved),
            "question": question,
            "model": model,
            "embedding_model": embedding_model,
            "top_k": top_k,
        },
    )

    for i, r in enumerate(retrieved, start=1):
        yield sse_event(
            "chunk_start",
            {"chunk_index": i, "chunk_count": len(retrieved)},
        )

        preview = (r.get("text") or "")[:200]
        yield sse_event(
            "chunk_complete",
            {
                "chunk_index": i,
                "matched": bool(preview),
                "preview": preview,
            },
        )

    if not data_payload:
        final_answer = NOT_FOUND_MESSAGE
        for content in stream_text_chunks(final_answer):
            yield sse_event("token", {"content": content})
        duration_seconds = round(time.time() - start_time, 2)
        yield sse_event(
            "complete",
            {
                "duration_seconds": duration_seconds,
                "matches_found": 0,
                "answer": final_answer,
            },
        )
        return

    try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": START_PROMPT.format(data=data_payload)},
                    {"role": "user", "content": question},
                ],
                temperature=0.0,
            )
            final_answer = (response.choices[0].message.content or "").strip()
        except APIError as exc:
            yield sse_event(
                "error",
                {
                    "message": str(exc),
                    "type": exc.type,
                    "code": exc.code,
                },
            )
            return
        except Exception as exc:
            yield sse_event(
                "error",
                {"message": str(exc)},
            )
            return
    except Exception as exc:
        yield sse_event("error", {"message": str(exc)})
        return

    if not final_answer:
        final_answer = NOT_FOUND_MESSAGE

    for content in stream_text_chunks(final_answer):
        yield sse_event("token", {"content": content})

    duration_seconds = round(time.time() - start_time, 2)
    yield sse_event(
        "complete",
        {
            "duration_seconds": duration_seconds,
            "matches_found": len(retrieved),
            "answer": final_answer,
        },
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/files")
def list_project_files():
    files_dir = PROJECT_ROOT / "files"
    files = [
        str(path.relative_to(files_dir))
        for path in files_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    return {"files": sorted(files)}


@app.post("/index/rebuild")
def index_rebuild():
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    persist_dir = PROJECT_ROOT / "chroma_db"
    store = ChromaStore(ChromaConfig(persist_dir=persist_dir, collection_name="project_files"))
    indexer = Indexer(
        store=store,
        config=IndexConfig(
            files_dir=PROJECT_ROOT / "files",
            embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        ),
    )
    try:
        meta = indexer.rebuild()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return meta


@app.get("/index/status")
def index_status():
    persist_dir = PROJECT_ROOT / "chroma_db"
    store = ChromaStore(ChromaConfig(persist_dir=persist_dir, collection_name="project_files"))
    return {
        "persist_dir": str(persist_dir),
        "collection_name": "project_files",
        "count": store.count(),
        "meta": store.read_index_meta(),
    }


@app.post("/chat/stream")
async def chat_stream(
    question: str = Form(...),
):
    model = "gpt-4o"
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        stream_chat_response(question.strip(), model),
        media_type="text/event-stream",
        headers=headers,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
