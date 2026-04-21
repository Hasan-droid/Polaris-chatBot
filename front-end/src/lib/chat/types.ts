export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  createdAt: number;
};

export type ChatRequest = {
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
};

