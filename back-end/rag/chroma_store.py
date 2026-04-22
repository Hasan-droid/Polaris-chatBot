import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import chromadb


@dataclass(frozen=True)
class ChromaConfig:
    persist_dir: Path
    collection_name: str = "project_files"


class ChromaStore:
    def __init__(self, config: ChromaConfig):
        self.config = config
        self.config.persist_dir.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(self.config.persist_dir))
        self._collection = self._client.get_or_create_collection(self.config.collection_name)

    def reset_collection(self) -> None:
        try:
            self._client.delete_collection(self.config.collection_name)
        except Exception:
            # If it doesn't exist, just recreate.
            pass
        self._collection = self._client.get_or_create_collection(self.config.collection_name)

    def count(self) -> int:
        return int(self._collection.count())

    def upsert_texts(
        self,
        *,
        ids: list[str],
        documents: list[str],
        metadatas: list[dict[str, Any]],
        embeddings: list[list[float]],
    ) -> None:
        if not (len(ids) == len(documents) == len(metadatas) == len(embeddings)):
            raise ValueError("ids/documents/metadatas/embeddings length mismatch")
        self._collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    def query(
        self,
        *,
        query_embedding: list[float],
        top_k: int,
    ) -> dict[str, Any]:
        return self._collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

    def write_index_meta(self, meta: dict[str, Any]) -> None:
        path = self.config.persist_dir / "index_meta.json"
        path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    def read_index_meta(self) -> dict[str, Any] | None:
        path = self.config.persist_dir / "index_meta.json"
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None

