"use client";

import { useMemo, useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { fetchWithRetry } from "@/lib/support/client-retry";
import { createId } from "@/lib/support/id";
import type { ChatMessage } from "@/lib/support/types";

interface ChatWindowProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onEscalateClick: () => void;
}

export function ChatWindow({ messages, setMessages, onEscalateClick }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTurnMessages, setLastTurnMessages] = useState<ChatMessage[] | null>(null);

  const canEscalate = useMemo(
    () => messages.some((message) => message.role === "user") && !isSending,
    [messages, isSending]
  );

  async function sendMessage(text: string, retryMessages?: ChatMessage[]) {
    const assistantId = createId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    const nextMessages =
      retryMessages ??
      [
        ...messages,
        {
          id: createId(),
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        },
      ];

    setMessages([...nextMessages, assistantPlaceholder]);
    setIsSending(true);
    setError(null);
    setLastTurnMessages(nextMessages);

    try {
      const response = await fetchWithRetry(
        "/api/ai/support-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        },
        { retries: 2, initialDelayMs: 400 }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Support assistant request failed.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response is unavailable.");
      }

      const decoder = new TextDecoder();
      let complete = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        complete += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content: complete } : message
          )
        );
      }

      if (!complete.trim()) {
        throw new Error("Assistant returned an empty answer. Please retry.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected chat error.";
      setError(message);
      setMessages((current) => current.filter((message) => message.id !== assistantId));
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value || isSending) {
      return;
    }

    setInput("");
    await sendMessage(value);
  }

  return (
    <section className="card panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Customer Chat</h2>
          <p className="panel-subtitle">AI troubleshooting with escalation-ready context</p>
        </div>
        <button onClick={onEscalateClick} disabled={!canEscalate}>
          Escalate to Ticket
        </button>
      </div>

      <div className="chat-feed">
        {!messages.length ? (
          <p className="chat-empty">
            Ask a question to start. The assistant can troubleshoot and collect context.
          </p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>

      {error ? (
        <div className="chat-error">
          <span>{error}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => void (lastTurnMessages ? sendMessage("", lastTurnMessages) : Promise.resolve())}
            disabled={isSending || !lastTurnMessages}
          >
            Retry
          </button>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="chat-compose">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe your issue..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !input.trim()}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
