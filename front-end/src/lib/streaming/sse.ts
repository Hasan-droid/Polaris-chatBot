export type SseEvent = {
  event?: string;
  data: string;
};

/**
 * Minimal SSE parser for `text/event-stream`.
 * It supports `event:` and `data:` lines and yields an event whenever a blank line is encountered.
 */
export function* parseSseLines(lines: Iterable<string>): Generator<SseEvent> {
  let event: string | undefined;
  let dataParts: string[] = [];

  const flush = () => {
    if (!event && dataParts.length === 0) return;
    const data = dataParts.join("\n");
    const out: SseEvent = { data };
    if (event) out.event = event;
    event = undefined;
    dataParts = [];
    return out;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line === "") {
      const out = flush();
      if (out) yield out;
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataParts.push(line.slice("data:".length).trimStart());
      continue;
    }
  }

  const out = flush();
  if (out) yield out;
}

