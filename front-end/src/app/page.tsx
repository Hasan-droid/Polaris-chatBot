import { ChatShell } from "@/components/chat/ChatShell";

export default function HomePage() {
  return (
    <main className="min-h-screen polaris-grid">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
        <header className="mb-6">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-polaris-500/20 ring-1 ring-polaris-500/30 shadow-glass flex items-center justify-center">
              <span className="font-display font-semibold text-polaris-200">
                P
              </span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight">
                Polaris Chatbot
              </h1>
              <p className="text-sm text-white/70">
                Simple professional UI, ready for streaming responses.
              </p>
            </div>
          </div>
        </header>

        <ChatShell />

        <footer className="mt-6 text-xs text-white/50">
          Configure backend streaming via{" "}
          <span className="font-mono">NEXT_PUBLIC_BACKEND_BASE_URL</span> and{" "}
          <span className="font-mono">NEXT_PUBLIC_BACKEND_STREAM_PATH</span>.
        </footer>
      </div>
    </main>
  );
}

