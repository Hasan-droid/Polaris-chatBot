"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";

export function ChatShell() {
  const { messages, isStreaming, canSend, error, send, stop } = useChat();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isStreaming]);

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-glass backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-polaris-500/20 ring-1 ring-polaris-500/30">
            <Bot className="h-5 w-5 text-polaris-200" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold leading-tight">
              Chat Agent
            </div>
            <div className="text-xs text-white/60">
              {isStreaming ? "Streaming response…" : "Ready"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-ink-800/60 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10 sm:inline">
            SSE / chunked streaming
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <MessageList messages={messages} />
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-white/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
          setText("");
        }}
      >
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming && text.trim().length > 0) {
                    void send(text);
                    setText("");
                  }
                }
              }}
              rows={1}
              placeholder="Type your message…"
              className={cn(
                "w-full resize-none rounded-2xl bg-ink-900/40 px-4 py-3 text-sm text-white",
                "ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-polaris-500/50",
                "placeholder:text-white/40"
              )}
            />
            <div className="mt-2 text-xs text-white/45">
              Press Enter to send (Shift+Enter for newline).
            </div>
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4",
                "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
              )}
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend || text.trim().length === 0}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium",
                "bg-polaris-500 text-white hover:bg-polaris-600",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

