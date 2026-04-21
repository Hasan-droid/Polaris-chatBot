## Polaris Chatbot Frontend (`front-end/`)

Next.js + Tailwind frontend for a **streaming** chatbot agent UI (SSE or chunked text).

### Quick start

- **Install deps** (you can use any package manager available in your environment):

```bash
cd front-end
npm install
```

- **WSL note (important)**:
  - If `npm` resolves to a Windows path like `/mnt/c/Program Files/nodejs/npm`, `npm run dev` may start `CMD.EXE` and Next will fail to find `src/app`.
  - Workaround: start Next using Linux `node` directly:

```bash
cd front-end
bash scripts/dev-wsl.sh
```

- **Configure env**:

```bash
cp .env.example .env.local
```

- **Run**:

```bash
npm run dev
```

### Where to change the backend streaming endpoint

- **Base URL**: `NEXT_PUBLIC_BACKEND_BASE_URL` in `.env.local`
- **Streaming path**: `NEXT_PUBLIC_BACKEND_STREAM_PATH` in `.env.local`

Those are combined in `src/lib/env.ts` via `buildBackendStreamUrl()`.

### How streaming is implemented

- **Streaming client**: `src/lib/chat/streamChat.ts`
  - If the backend returns `content-type: text/event-stream`, it will parse SSE `data:` lines.
  - Otherwise it falls back to raw chunked streaming (reads from `ReadableStream`).
- **UI hook**: `src/hooks/useChat.ts` (updates assistant message as tokens arrive)

### Docs

- `docs/STRUCTURE.md`: folder structure + conventions
- `docs/STREAMING.md`: backend contract + examples + where to wire changes
- `docs/THEMING.md`: Polaris-like theme tokens (colors/fonts/feel)

