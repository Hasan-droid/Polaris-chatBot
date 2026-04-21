## Project structure

```
front-end/
  docs/                          # developer docs (this folder)
  src/
    app/                         # Next.js App Router entrypoints
      globals.css
      layout.tsx
      page.tsx
    components/
      chat/                      # chat UI components
        ChatShell.tsx
        MessageBubble.tsx
        MessageList.tsx
    hooks/
      useChat.ts                 # chat state + streaming integration
    lib/
      cn.ts                      # className helper (clsx + tailwind-merge)
      env.ts                     # public env validation + URL builder
      chat/
        streamChat.ts            # streaming fetch client
        types.ts                 # chat types
      streaming/
        textStream.ts            # ReadableStream helpers
        sse.ts                   # optional SSE parsing utilities
```

### Folder conventions (best practice)

- **`src/app/`**: routes/layouts only; keep logic in `components/`, `hooks/`, `lib/`.
- **`src/components/`**: UI only (pure rendering where possible).
- **`src/hooks/`**: state + UI orchestration; no direct styling.
- **`src/lib/`**: reusable utilities and “infrastructure” (API, streaming, parsing, env).

