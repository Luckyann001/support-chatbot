"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { TicketForm } from "@/components/support/TicketForm";
import { TicketList } from "@/components/support/TicketList";
import { createId } from "@/lib/support/id";
import type { ChatMessage } from "@/lib/support/types";

export default function SupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi, I am your support assistant. Tell me what is going wrong and I will help troubleshoot.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [createdSignal, setCreatedSignal] = useState(0);

  return (
    <main>
      <div className="support-shell">
        <header className="card support-hero">
          <div>
            <h1>AI Chatbot + Support Desk</h1>
            <p>
              Triage customer issues with AI first, then escalate to structured tickets with a
              handoff summary your support team can action immediately.
            </p>
          </div>
          <div className="support-badge">Premium Support Flow</div>
        </header>

        <div className="support-grid">
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            onEscalateClick={() => setShowEscalationForm(true)}
          />
          <TicketList createdSignal={createdSignal} />
        </div>
      </div>

      {showEscalationForm ? (
        <TicketForm
          messages={messages}
          onClose={() => setShowEscalationForm(false)}
          onCreated={() => setCreatedSignal((value) => value + 1)}
        />
      ) : null}
    </main>
  );
}
