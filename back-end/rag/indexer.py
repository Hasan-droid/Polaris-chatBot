import hashlib
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path

from openai import OpenAI

from DocParser import extract_text
from rag.chroma_store import ChromaStore


SUPPORTED_EXTENSIONS = {".docx", ".pdf", ".txt", ".md", ".rtf"}


def _extract_rtf_text(file_path: Path) -> str:
    raw = file_path.read_text(encoding="utf-8", errors="ignore")
    raw = re.sub(r"{\\\*[^{}]*}", " ", raw)
    raw = raw.replace("\\par", "\n").replace("\\line", "\n").replace("\\tab", "\t")
    raw = re.sub(r"\\'[0-9a-fA-F]{2}", " ", raw)
    raw = re.sub(r"\\[a-zA-Z]+\d* ?", " ", raw)
    raw = raw.replace("{", " ").replace("}", " ")
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    raw = re.sub(r"[ \t]{2,}", " ", raw)
    return raw.strip()


def chunk_for_embeddings(text: str, *, chunk_size: int = 1800, overlap: int = 200) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        if end < len(text):
            # Prefer breaking at paragraph/newline/sentence.
            for break_char in ["\n\n", "\n", ". "]:
                last_break = text.rfind(break_char, start, end)
                if last_break != -1 and last_break > start + int(chunk_size * 0.5):
                    end = last_break + len(break_char)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(0, end - overlap)
    return chunks


def _stable_id(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8", errors="ignore"))
        h.update(b"\x00")
    return h.hexdigest()[:32]


@dataclass(frozen=True)
class IndexConfig:
    files_dir: Path
    embedding_model: str = "text-embedding-3-small"


class Indexer:
    def __init__(self, *, store: ChromaStore, config: IndexConfig):
        self.store = store
        self.config = config
        self._openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        resp = self._openai.embeddings.create(model=self.config.embedding_model, input=texts)
        # API returns results in the same order as inputs.
        return [item.embedding for item in resp.data]

    def rebuild(self) -> dict:
        if not self.config.files_dir.exists() or not self.config.files_dir.is_dir():
            raise FileNotFoundError(f"files directory not found: {self.config.files_dir}")

        self.store.reset_collection()

        all_ids: list[str] = []
        all_docs: list[str] = []
        all_metas: list[dict] = []
        files_indexed: list[str] = []

        for path in sorted(self.config.files_dir.rglob("*")):
            if not path.is_file():
                continue
            if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue

            rel = str(path.relative_to(self.config.files_dir))
            try:
                if path.suffix.lower() == ".rtf":
                    text = _extract_rtf_text(path)
                else:
                    text = extract_text(str(path))
            except Exception:
                continue

            chunks = chunk_for_embeddings(text)
            if not chunks:
                continue

            files_indexed.append(rel)
            for idx, chunk in enumerate(chunks):
                cid = _stable_id(rel, str(idx), chunk[:200])
                all_ids.append(cid)
                all_docs.append(chunk)
                all_metas.append(
                    {
                        "source": rel,
                        "chunk_index": idx,
                    }
                )

        # Batch embeddings to avoid large payloads.
        batch_size = 96
        for start in range(0, len(all_docs), batch_size):
            end = start + batch_size
            docs_batch = all_docs[start:end]
            embeds = self._embed_texts(docs_batch)
            self.store.upsert_texts(
                ids=all_ids[start:end],
                documents=docs_batch,
                metadatas=all_metas[start:end],
                embeddings=embeds,
            )

        meta = {
            "files_dir": str(self.config.files_dir.name) + "/",
            "files_indexed": sorted(set(files_indexed)),
            "files_indexed_count": len(set(files_indexed)),
            "chunks_indexed": len(all_docs),
            "embedding_model": self.config.embedding_model,
            "indexed_at_unix": int(time.time()),
        }
        self.store.write_index_meta(meta)
        return meta

