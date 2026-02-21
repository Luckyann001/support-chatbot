import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { ChatMessage, SupportTicket, TicketStatus } from "@/lib/support/types";

const DATA_DIR = join(process.cwd(), "data");
const TICKETS_FILE = join(DATA_DIR, "tickets.json");

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(TICKETS_FILE, "utf-8");
  } catch {
    await writeFile(TICKETS_FILE, JSON.stringify([]), "utf-8");
  }
}

async function readTickets(): Promise<SupportTicket[]> {
  await ensureStore();
  const raw = await readFile(TICKETS_FILE, "utf-8");
  const parsed = JSON.parse(raw) as SupportTicket[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTickets(tickets: SupportTicket[]) {
  await ensureStore();
  await writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
}

export async function listTickets(): Promise<SupportTicket[]> {
  const tickets = await readTickets();
  return tickets.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function createTicket(input: {
  title: string;
  customerName: string;
  customerEmail: string;
  summary: string;
  messages: ChatMessage[];
}): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: randomUUID(),
    status: "open",
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  const tickets = await readTickets();
  tickets.unshift(ticket);
  await writeTickets(tickets);
  return ticket;
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket | null> {
  const tickets = await readTickets();
  const index = tickets.findIndex((ticket) => ticket.id === id);
  if (index === -1) {
    return null;
  }

  tickets[index] = {
    ...tickets[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeTickets(tickets);
  return tickets[index];
}
