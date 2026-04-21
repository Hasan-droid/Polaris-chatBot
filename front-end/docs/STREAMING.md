## Streaming backend contract

This frontend is prepared to receive streaming responses from your backend via **one POST endpoint**.

### Environment variables (start point)

In `front-end/.env.local`:

- `NEXT_PUBLIC_BACKEND_BASE_URL` (example: `http://localhost:8000`)
- `NEXT_PUBLIC_BACKEND_STREAM_PATH` (example: `/chat/stream`)

They are combined in:

- `src/lib/env.ts` → `buildBackendStreamUrl()`

### Request shape

Frontend sends:

```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi" },
    { "role": "user", "content": "Explain streaming." }
  ]
}
```

Implementation: `src/lib/chat/streamChat.ts`

### Supported streaming response types

#### Option A) SSE (recommended)

Backend returns:

- status 200
- header `Content-Type: text/event-stream`

Stream body like:

```
data: Hello

data:  there

data: !

data: [DONE]

```

Notes:

- Each blank line ends an SSE event.
- This frontend reads only `data:` lines.
- `[DONE]` ends the stream.

#### Option B) Raw chunked text

Backend returns:

- status 200
- header `Content-Type: text/plain` (or similar)

and just writes bytes progressively; the frontend appends each chunk as it arrives.

### Where to change streaming implementation

- **Main streaming function**: `src/lib/chat/streamChat.ts`
  - Change headers, payload shape, parsing rules, `[DONE]` sentinel, etc.
- **UI integration**: `src/hooks/useChat.ts`
  - Change how messages are converted into the request payload.

### Common backend gotchas

- Ensure the backend **flushes** output as it streams (framework-specific).
- Ensure CORS allows the Next.js dev origin (usually `http://localhost:3000`).
- For SSE, ensure proxies/load balancers do not buffer responses.

