## Streaming backend contract

This frontend is prepared to receive streaming responses from your backend via **one POST endpoint**.

### Environment variables (start point)

In `front-end/.env.local`:

- `NEXT_PUBLIC_BACKEND_BASE_URL` (example: `http://localhost:8000`)
- `NEXT_PUBLIC_BACKEND_STREAM_PATH` (example: `/chat/stream`)

They are combined in:

- `src/lib/env.ts` → `buildBackendStreamUrl()`

### Request shape

Frontend sends **`multipart/form-data`** with one field:

- `question` (string, required)

Example (curl):

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -F "question=What is this document about?" \
```

Implementation: `src/lib/chat/streamChat.ts`

### Supported streaming response types

#### Option A) SSE (recommended)

Backend returns:

- status 200
- header `Content-Type: text/event-stream`

This backend uses **named SSE events** with **JSON payloads**.

Possible events:

- `event: start` (metadata; ignored by the UI)
- `event: chunk_start` (metadata; ignored by the UI)
- `event: chunk_complete` (metadata; ignored by the UI)
- `event: token` (streaming answer text; appended to the assistant message)
- `event: complete` (end of stream)
- `event: error` (stream fails; surfaced in UI)

Stream body like:

```
event: token
data: {"content":"Hello"}

event: token
data: {"content":" there"}

event: token
data: {"content":"!"}

event: complete
data: {"duration_seconds":1.23,"matches_found":2,"answer":"Hello there!"}

```

Notes:

- Each blank line ends an SSE event.
- This frontend uses `event:` to decide what to do:
  - `token` → append `data.content`
  - `complete` → finish
  - `error` → throw `data.message`

#### Option B) Raw chunked text

Backend returns:

- status 200
- header `Content-Type: text/plain` (or similar)

and just writes bytes progressively; the frontend appends each chunk as it arrives.

### Where to change streaming implementation

- **Main streaming function**: `src/lib/chat/streamChat.ts`
  - Change payload shape, parsing rules, event names, etc.
- **UI integration**: `src/hooks/useChat.ts`
  - Change how the input text is mapped into the `question` field.

### Common backend gotchas

- Ensure the backend **flushes** output as it streams (framework-specific).
- Ensure CORS allows the Next.js dev origin (usually `http://localhost:3000`).
- For SSE, ensure proxies/load balancers do not buffer responses.

