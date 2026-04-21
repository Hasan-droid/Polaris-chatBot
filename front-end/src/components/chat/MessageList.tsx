import type { ChatMessage } from "@/lib/chat/types";
import { MessageBubble } from "./MessageBubble";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}

