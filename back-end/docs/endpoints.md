# API Endpoints

Base URL while running locally:

`http://localhost:8000`

## 1. `GET /health`

Simple health check endpoint.

Input:

- no request body

Success response:

```json
{
  "status": "ok"
}
```

Example:

```bash
curl http://localhost:8000/health
```

## 2. `GET /files`

Returns all supported files inside `back-end/files/`.

Supported file types:

- `.docx`
- `.pdf`
- `.txt`
- `.md`
- `.rtf`

Input:

- no request body

Success response:

```json
{
  "files": [
    "example.pdf",
    "notes/readme.md"
  ]
}
```

Example:

```bash
curl http://localhost:8000/files
```

## 3. `POST /chat/stream`

Streams chatbot results as Server-Sent Events (SSE).

Content type:

`multipart/form-data`

Inputs:

- `question` (string, required): question to ask about the indexed file contents

Example request:

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -F "question=What is this document about?"
```

Response type:

`text/event-stream`

Possible SSE events:

### `start`

Sent once before chunk processing starts.

Example payload:

```json
{
  "files_dir": "files/",
  "chunk_count": 3,
  "question": "What is this document about?",
  "model": "gpt-4o",
  "embedding_model": "text-embedding-3-small",
  "top_k": 6
}
```

### `chunk_start`

Sent before a single document chunk is processed.

Example payload:

```json
{
  "chunk_index": 1,
  "chunk_count": 3
}
```

### `chunk_complete`

Sent after a chunk is processed.

Example payload:

```json
{
  "chunk_index": 1,
  "matched": true,
  "preview": "This chunk contains the answer..."
}
```

### `token`

Sent while streaming the final answer text.

Example payload:

```json
{
  "content": "part of the final answer"
}
```

### `complete`

Sent once at the end of a successful stream.

Example payload:

```json
{
  "duration_seconds": 1.23,
  "matches_found": 2,
  "answer": "final combined answer"
}
```

### `error`

Sent when the request cannot continue.

Possible causes:

- `OPENAI_API_KEY` is missing
- vector index is empty (run `POST /index/rebuild`)
- OpenAI API returns an error
- another runtime error happens during chunk processing

Example payload:

```json
{
  "message": "OPENAI_API_KEY is not configured"
}
```

## 4. `POST /index/rebuild`

Builds (or rebuilds) the Chroma vector index from files located in `back-end/files/`.

Example:

```bash
curl -X POST http://localhost:8000/index/rebuild
```

Success response (example):

```json
{
  "files_dir": "files/",
  "files_indexed": ["Polaris Email Policy V1.0.rtf"],
  "files_indexed_count": 1,
  "chunks_indexed": 42,
  "embedding_model": "text-embedding-3-small",
  "indexed_at_unix": 1760000000
}
```

## 5. `GET /index/status`

Returns basic information about the current persisted Chroma index.

Example:

```bash
curl http://localhost:8000/index/status
```
