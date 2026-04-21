export const env = {
  backendBaseUrl:
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000",
  backendStreamPath:
    process.env.NEXT_PUBLIC_BACKEND_STREAM_PATH ?? "/chat/stream"
};

export function buildBackendStreamUrl(): string {
  const base = env.backendBaseUrl.replace(/\/+$/, "");
  const path = env.backendStreamPath.startsWith("/")
    ? env.backendStreamPath
    : `/${env.backendStreamPath}`;
  return `${base}${path}`;
}

