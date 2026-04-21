export async function* streamTextChunks(
  response: Response
): AsyncGenerator<string> {
  const body = response.body;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    yield decoder.decode(value, { stream: true });
  }
}

export async function* streamLines(
  response: Response
): AsyncGenerator<string> {
  let buffer = "";
  for await (const chunk of streamTextChunks(response)) {
    buffer += chunk;
    const parts = buffer.split(/\n/);
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      yield line;
    }
  }
  if (buffer) yield buffer;
}

