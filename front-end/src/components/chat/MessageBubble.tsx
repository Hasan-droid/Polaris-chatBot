import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/cn";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-polaris-500/20 ring-1 ring-polaris-500/30">
          <Bot className="h-4 w-4 text-polaris-200" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1",
          isUser
            ? "bg-polaris-500 text-white ring-polaris-600/40"
            : "bg-white/7 text-white ring-white/10"
        )}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content || (!isUser ? "…" : "")}
        </div>
      </div>

      {isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <User className="h-4 w-4 text-white/80" />
        </div>
      ) : null}
    </div>
  );
}

