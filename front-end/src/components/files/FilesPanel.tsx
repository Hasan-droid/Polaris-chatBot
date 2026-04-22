"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildBackendUrl } from "@/lib/env";

type FilesResponse = {
  files: string[];
};

export function FilesPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => buildBackendUrl("/files"), []);

  useEffect(() => {
    const ac = new AbortController();

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(url, {
          method: "GET",
          headers: { accept: "application/json" },
          signal: ac.signal,
          cache: "no-store"
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Backend error ${res.status}: ${text || res.statusText}`
          );
        }

        const json = (await res.json()) as Partial<FilesResponse>;
        if (!json || !Array.isArray(json.files)) {
          throw new Error("Invalid response from GET /files");
        }

        setFiles(json.files);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load files.");
      } finally {
        setIsLoading(false);
      }
    }

    void run();
    return () => ac.abort();
  }, [url]);

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glass backdrop-blur",
        "flex flex-col"
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-polaris-500/20 ring-1 ring-polaris-500/30">
          <FileText className="h-5 w-5 text-polaris-200" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold leading-tight">
            Files
          </div>
          <div className="truncate text-xs text-white/60">
            {isLoading
              ? "Loading…"
              : error
                ? "Failed to load"
                : `${files.length} found`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error ? (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="text-sm text-white/60">Fetching file list…</div>
        ) : files.length === 0 ? (
          <div className="text-sm text-white/60">No files found.</div>
        ) : (
          <ul className="space-y-2">
            {files.map((name) => (
              <li key={name}>
                <div
                  title={name}
                  className="truncate rounded-xl bg-ink-900/30 px-3 py-2 text-sm text-white/80 ring-1 ring-white/10"
                >
                  {name}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

