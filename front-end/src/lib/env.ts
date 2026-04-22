export const env = {
  backendBaseUrl:
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000",
  backendStreamPath:
    process.env.NEXT_PUBLIC_BACKEND_STREAM_PATH ?? "/chat/stream"
};

export function buildBackendUrl(path: string): string {
  const base = env.backendBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function buildBackendStreamUrl(): string {
  const path = env.backendStreamPath.startsWith("/")
    ? env.backendStreamPath
    : `/${env.backendStreamPath}`;
  return buildBackendUrl(path);
}

