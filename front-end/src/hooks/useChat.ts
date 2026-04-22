"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { streamChat } from "@/lib/chat/streamChat";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi! I’m your Polaris chatbot. Ask me anything—responses will stream in as they’re generated.",
      createdAt: Date.now()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const canSend = useMemo(() => !isStreaming, [isStreaming]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content,
        createdAt: Date.now()
      };

      const assistantId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now()
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        await streamChat(
          {
            question: content
          },
          {
            onToken: (token) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + token }
                    : m
                )
              );
            },
            onDone: () => {}
          },
          ac.signal
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Streaming failed";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || "Sorry, something went wrong." }
              : m
          )
        );
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming]
  );

  return { messages, isStreaming, canSend, error, send, stop };
}

