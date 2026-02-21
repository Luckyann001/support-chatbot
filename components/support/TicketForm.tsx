"use client";

import { useState } from "react";
import { fetchWithRetry } from "@/lib/support/client-retry";
import type { ChatMessage, SupportTicket } from "@/lib/support/types";

interface TicketFormProps {
  messages: ChatMessage[];
  onClose: () => void;
  onCreated: (ticket: SupportTicket) => void;
}

export function TicketForm({ messages, onClose, onCreated }: TicketFormProps) {
  const [title, setTitle] = useState("Need agent follow-up");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !customerName.trim() || !customerEmail.trim()) {
      setError("All ticket fields are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithRetry(
        "/api/support/tickets",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            customerName,
            customerEmail,
            messages,
          }),
        },
        { retries: 2, initialDelayMs: 400 }
      );

      const payload = (await response.json()) as { ticket?: SupportTicket; error?: string };
      if (!response.ok || !payload.ticket) {
        throw new Error(payload.error || "Ticket creation failed.");
      }

      onCreated(payload.ticket);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create ticket.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-shell">
      <div className="card modal-card">
        <h3 className="modal-title">Escalate to Support Ticket</h3>
        <p className="modal-subtitle">
          This creates a ticket and generates a structured AI summary from the chat.
        </p>

        <form onSubmit={onSubmit} className="modal-form">
          <label className="modal-label">
            Ticket title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="modal-label">
            Customer name
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </label>

          <label className="modal-label">
            Customer email
            <input
              value={customerEmail}
              type="email"
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </label>

          {error ? <div className="modal-error">{error}</div> : null}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
