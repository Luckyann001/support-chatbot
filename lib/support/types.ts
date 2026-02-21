export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  status: TicketStatus;
  summary: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
