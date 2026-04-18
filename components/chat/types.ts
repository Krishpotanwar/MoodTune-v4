import type { Track } from "@/lib/schema";

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
  tracks?: Track[];
  blendUsed?: boolean;
};
