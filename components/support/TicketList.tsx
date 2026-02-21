"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithRetry } from "@/lib/support/client-retry";
import type { SupportTicket, TicketStatus } from "@/lib/support/types";

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved"];

function statusColor(status: TicketStatus): string {
  if (status === "resolved") return "var(--success)";
  if (status === "in_progress") return "var(--warning)";
  return "var(--primary)";
}

export function TicketList({ createdSignal }: { createdSignal: number }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithRetry(
        "/api/support/tickets",
        { method: "GET", cache: "no-store" },
        { retries: 2, initialDelayMs: 350 }
      );
      const payload = (await response.json()) as { tickets?: SupportTicket[]; error?: string };
      if (!response.ok || !payload.tickets) {
        throw new Error(payload.error || "Failed to load tickets.");
      }
      setTickets(payload.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected ticket fetch error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets, createdSignal]);

  async function onStatusChange(ticketId: string, status: TicketStatus) {
    setSavingId(ticketId);
    setError(null);

    try {
      const response = await fetchWithRetry(
        `/api/support/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
        { retries: 2, initialDelayMs: 350 }
      );
      const payload = (await response.json()) as { ticket?: SupportTicket; error?: string };
      if (!response.ok || !payload.ticket) {
        throw new Error(payload.error || "Failed to update status.");
      }

      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? payload.ticket! : ticket))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="card panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Support Queue</h2>
          <p className="panel-subtitle">Track escalations and update ticket status</p>
        </div>
        <button onClick={() => void loadTickets()} disabled={loading} className="secondary">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="ticket-error">
          {error} <button onClick={() => void loadTickets()}>Retry</button>
        </div>
      ) : null}

      {!loading && tickets.length === 0 ? (
        <p className="panel-subtitle" style={{ marginBottom: 0 }}>
          No tickets yet.
        </p>
      ) : null}

      <div className="ticket-list">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="ticket-card">
            <div className="ticket-head">
              <div>
                <h3 className="ticket-title">{ticket.title}</h3>
                <div className="ticket-meta">
                  {ticket.customerName} ({ticket.customerEmail})
                </div>
                <div className="ticket-meta">Created: {new Date(ticket.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <select
                  value={ticket.status}
                  className="status-select"
                  disabled={savingId === ticket.id}
                  onChange={(event) => void onStatusChange(ticket.id, event.target.value as TicketStatus)}
                  style={{ color: statusColor(ticket.status) }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <pre className="ticket-summary">{ticket.summary}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}
