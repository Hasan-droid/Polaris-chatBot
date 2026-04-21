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

Returns all supported files inside the project directory.

Supported file types:

- `.docx`
- `.pdf`
- `.txt`
- `.md`

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

- `question` (string, required): question to ask about the file contents
- `model` (string, optional): OpenAI model name, default is `gpt-4o`

Example request:

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -F "file_path=sample.pdf" \
  -F "question=What is this document about?" \
  -F "model=gpt-4o"
```

Response type:

`text/event-stream`

Possible SSE events:

### `start`

Sent once before chunk processing starts.

Example payload:

```json
{
  "file_name": "sample.pdf",
  "file_path": "sample.pdf",
  "chunk_count": 3,
  "question": "What is this document about?",
  "model": "gpt-4o"
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
- file parsing fails
- file has no readable text
- OpenAI API returns an error
- another runtime error happens during chunk processing

Example payload:

```json
{
  "message": "OPENAI_API_KEY is not configured"
}
```

## Important note about current implementation

The endpoint definition accepts `file_path`, but the current code does not use the submitted `file_path` value when selecting the file to read.

At the moment, the implementation resolves a path named `files` inside the project instead of using the posted `file_path` field. If that path does not exist as a supported file, the request will fail before streaming starts.
