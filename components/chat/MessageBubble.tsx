import type { ChatMessage } from "@/lib/support/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const roleClass = message.role === "user" ? "user" : "assistant";

  return (
    <div className={`chat-row ${roleClass}`}>
      <div className={`chat-bubble ${roleClass}`}>{message.content}</div>
    </div>
  );
}
