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
 * Sends the conversation to the backend and streams the assistant response.
 *
 * Backend contract (recommended):
 * - POST {baseUrl}{path}
 * - Accepts JSON body: { messages: [{role, content}, ...] }
 * - Returns streaming:
 *   - `text/event-stream` where each `data:` line is a text chunk, OR
 *   - `text/plain` chunked response
 */
export async function streamChat(
  payload: ChatRequest,
  { onToken, onDone }: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = buildBackendStreamUrl();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream, text/plain, application/json"
    },
    body: JSON.stringify(payload),
    signal
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${errText || res.statusText}`);
  }

  if (isSseResponse(res)) {
    let dataParts: string[] = [];

    const flush = () => {
      if (dataParts.length === 0) return;
      const data = dataParts.join("\n");
      dataParts = [];
      if (data === "[DONE]") return "DONE" as const;
      onToken(data);
      return;
    };

    for await (const line of streamLines(res)) {
      const trimmed = line.replace(/\r$/, "");
      if (trimmed === "") {
        const out = flush();
        if (out === "DONE") {
          onDone?.();
          return;
        }
        continue;
      }

      if (trimmed.startsWith("data:")) {
        dataParts.push(trimmed.slice("data:".length).trimStart());
      }
    }

    flush();
    onDone?.();
    return;
  }

  for await (const chunk of streamTextChunks(res)) {
    if (chunk) onToken(chunk);
  }
  onDone?.();
}

