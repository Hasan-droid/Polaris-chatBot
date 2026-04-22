import { HealthBanner } from "@/components/HealthBanner";
import { ChatShell } from "@/components/chat/ChatShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function HomePage() {
  return (
    <main className="h-screen polaris-grid">
      <HealthBanner />
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-10">
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

        <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
          <div className="md:w-1/4">
            <FilesPanel />
          </div>
          <div className="min-w-0 flex-1">
            <ChatShell />
          </div>
        </div>

        <footer className="mt-6 text-xs text-white/50">
          Configure backend streaming via{" "}
          <span className="font-mono">NEXT_PUBLIC_BACKEND_BASE_URL</span> and{" "}
          <span className="font-mono">NEXT_PUBLIC_BACKEND_STREAM_PATH</span>.
        </footer>
      </div>
    </main>
  );
}

