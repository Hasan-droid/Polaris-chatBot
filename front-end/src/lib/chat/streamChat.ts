import { buildBackendStreamUrl } from "@/lib/env";
import { streamLines, streamTextChunks } from "@/lib/streaming/textStream";
import type { ChatRequest } from "./types";

export type StreamCallbacks = {
  onToken: (token: string) => void;
  onDone?: () => void;
};

function isSseResponse(res: Response) {
  const ct = res.headers.get("content-type") ?? "";
  return ct.toLowerCase().includes("text/event-stream");
}

/**
 * Sends a question to the backend and streams the assistant response.
 *
 * Backend contract (see `docs/endpoints.md`):
 * - POST {baseUrl}{path}
 * - Accepts `multipart/form-data` with field `question`
 * - Returns `text/event-stream` (SSE)
 */
export async function streamChat(
  payload: ChatRequest,
  { onToken, onDone }: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = buildBackendStreamUrl();

  const form = new FormData();
  form.set("question", payload.question);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "text/event-stream, text/plain, application/json"
    },
    body: form,
    signal
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${errText || res.statusText}`);
  }

  if (isSseResponse(res)) {
    let eventName: string | null = null;
    let dataParts: string[] = [];

    const flush = () => {
      if (dataParts.length === 0) return;
      const data = dataParts.join("\n");
      dataParts = [];
      const currentEvent = eventName;
      eventName = null;

      // Compatibility with simpler SSE streams that signal completion via [DONE]
      if (data === "[DONE]") return "DONE" as const;

      // This backend sends JSON payloads for named events.
      let parsed: unknown = undefined;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = undefined;
      }

      if (currentEvent === "token") {
        const content =
          typeof parsed === "object" &&
          parsed !== null &&
          "content" in parsed &&
          typeof (parsed as any).content === "string"
            ? (parsed as any).content
            : data;
        onToken(content);
        return;
      }

      if (currentEvent === "complete") return "DONE" as const;

      if (currentEvent === "error") {
        const message =
          typeof parsed === "object" &&
          parsed !== null &&
          "message" in parsed &&
          typeof (parsed as any).message === "string"
            ? (parsed as any).message
            : "Streaming failed";
        throw new Error(message);
      }

      // Ignore non-token events (start, chunk_start, chunk_complete).
      return;
    };

    for await (const line of streamLines(res)) {
      const trimmed = line.replace(/\r$/, "");
      if (trimmed === "") {
        const out = flush();
        if (out === "DONE") break;
        continue;
      }

      if (trimmed.startsWith("event:")) {
        eventName = trimmed.slice("event:".length).trim();
        continue;
      }

      if (trimmed.startsWith("data:")) {
        dataParts.push(trimmed.slice("data:".length).trimStart());
      }
    }

    const out = flush();
    if (out === "DONE") {
      onDone?.();
      return;
    }
    onDone?.();
    return;
  }

  for await (const chunk of streamTextChunks(res)) {
    if (chunk) onToken(chunk);
  }
  onDone?.();
}

