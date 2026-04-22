export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  createdAt: number;
};

export type ChatRequest = {
  /**
   * Backend contract (see `docs/endpoints.md`):
   * `multipart/form-data` field: `question`
   */
  question: string;
};

