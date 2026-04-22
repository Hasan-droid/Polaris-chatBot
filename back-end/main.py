import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import APIError, OpenAI

from DocParser import chunk_text, extract_text
from LLmPrompt import START_PROMPT

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
PROJECT_ROOT = Path(__file__).resolve().parent
SUPPORTED_EXTENSIONS = {".docx", ".pdf", ".txt", ".md"}
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


def resolve_project_file(file_path):
    candidate = (PROJECT_ROOT / file_path).resolve()

    if PROJECT_ROOT not in candidate.parents and candidate != PROJECT_ROOT:
        raise HTTPException(status_code=400, detail="File must be inside the project")

    if not candidate.exists() or not candidate.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    if candidate.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return candidate


def stream_chat_response(file_path, question, model):
    if not os.getenv("OPENAI_API_KEY"):
        yield sse_event("error", {"message": "OPENAI_API_KEY is not configured"})
        return

    try:
        text = extract_text(str(file_path))
    except Exception as exc:
        yield sse_event("error", {"message": f"Failed to parse file: {exc}"})
        return

    if not text.strip():
        yield sse_event("error", {"message": "No readable text was found in the file"})
        return

    chunks = chunk_text(text)
    matching_answers = []
    start_time = time.time()

    yield sse_event(
        "start",
        {
            "file_name": file_path.name,
            "file_path": str(file_path.relative_to(PROJECT_ROOT)),
            "chunk_count": len(chunks),
            "question": question,
            "model": model,
        },
    )

    for i, chunk in enumerate(chunks, start=1):
        yield sse_event(
            "chunk_start",
            {"chunk_index": i, "chunk_count": len(chunks)},
        )

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": START_PROMPT.format(data=chunk)},
                    {"role": "user", "content": question},
                ],
                temperature=0.0,
            )
            chunk_answer = (response.choices[0].message.content or "").strip()
            found_match = bool(chunk_answer) and not is_not_found_answer(chunk_answer)
            if found_match:
                matching_answers.append(chunk_answer)

            yield sse_event(
                "chunk_complete",
                {
                    "chunk_index": i,
                    "matched": found_match,
                    "preview": chunk_answer[:200],
                },
            )
        except APIError as exc:
            yield sse_event(
                "error",
                {
                    "message": str(exc),
                    "type": exc.type,
                    "code": exc.code,
                    "chunk_index": i,
                },
            )
            return
        except Exception as exc:
            yield sse_event(
                "error",
                {"message": str(exc), "chunk_index": i},
            )
            return

    if not matching_answers:
        final_answer = NOT_FOUND_MESSAGE
    else:
        unique_answers = list(dict.fromkeys(matching_answers))
        final_answer = "\n\n".join(unique_answers)

    for content in stream_text_chunks(final_answer):
        yield sse_event("token", {"content": content})

    duration_seconds = round(time.time() - start_time, 2)
    yield sse_event(
        "complete",
        {
            "duration_seconds": duration_seconds,
            "matches_found": len(matching_answers),
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


@app.post("/chat/stream")
async def chat_stream(
    question: str = Form(...),
    model: str = Form(default="gpt-4o"),
):
    selected_file = resolve_project_file(PROJECT_ROOT/"files")
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        stream_chat_response(selected_file, question.strip(), model),
        media_type="text/event-stream",
        headers=headers,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
