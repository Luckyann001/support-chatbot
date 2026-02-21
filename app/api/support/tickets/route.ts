import { NextRequest } from "next/server";
import { createTicket, listTickets } from "@/lib/support/tickets-store";
import { buildChatTranscript, buildTicketSummaryPrompt } from "@/lib/support/prompt";
import { getOpenAIClient } from "@/lib/support/openai";
import { withRetry } from "@/lib/support/retry";
import type { ChatMessage } from "@/lib/support/types";

export const runtime = "nodejs";

function localSummaryFallback(messages: ChatMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content;
  return [
    "Issue:",
    lastUserMessage || "Customer requested support.",
    "",
    "Customer Impact:",
    "Unknown from transcript.",
    "",
    "Steps Tried:",
    "Conversation captured in thread.",
    "",
    "Recommended Next Action:",
    "Agent review and follow-up with customer.",
  ].join("\n");
}

async function generateSummary(messages: ChatMessage[]) {
  const transcript = buildChatTranscript(messages);
  const prompt = buildTicketSummaryPrompt(transcript);

  try {
    const client = getOpenAIClient();
    const completion = await withRetry<any>(
      () =>
        client.responses.create({
          model: process.env.SUPPORT_SUMMARY_MODEL || process.env.SUPPORT_CHAT_MODEL || "gpt-4.1-mini",
          input: prompt,
        }),
      { retries: 2, initialDelayMs: 350 }
    );

    return completion.output_text?.trim() || localSummaryFallback(messages);
  } catch {
    return localSummaryFallback(messages);
  }
}

export async function GET() {
  try {
    const tickets = await listTickets();
    return Response.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tickets.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title?: string;
      customerName?: string;
      customerEmail?: string;
      messages?: ChatMessage[];
    };

    const title = body.title?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim();
    const messages = body.messages ?? [];

    if (!title || !customerName || !customerEmail || !messages.length) {
      return Response.json(
        {
          error: "title, customerName, customerEmail and messages are required.",
        },
        { status: 400 }
      );
    }

    const summary = await generateSummary(messages);
    const ticket = await createTicket({
      title,
      customerName,
      customerEmail,
      summary,
      messages,
    });

    return Response.json({ ticket }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create ticket.";
    return Response.json({ error: message }, { status: 500 });
  }
}
