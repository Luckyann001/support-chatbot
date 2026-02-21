import type { ChatMessage } from "@/lib/support/types";

export const SUPPORT_SYSTEM_PROMPT = `You are a support assistant for a SaaS product.
Give direct troubleshooting guidance, ask clarifying questions when needed, and keep replies concise and practical.
If you do not know details, be explicit and offer the next best action.`;

export function buildChatTranscript(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content.trim()}`)
    .join("\n");
}

export function buildTicketSummaryPrompt(transcript: string): string {
  return [
    "Summarize this support conversation into a concise support ticket.",
    "Return plain text with exactly these sections:",
    "Issue:",
    "Customer Impact:",
    "Steps Tried:",
    "Recommended Next Action:",
    "Conversation:",
    transcript,
  ].join("\n\n");
}
