import { NextRequest } from "next/server";
import { withRetry } from "@/lib/support/retry";
import { getOpenAIClient } from "@/lib/support/openai";
import { SUPPORT_SYSTEM_PROMPT } from "@/lib/support/prompt";
import type { ChatMessage } from "@/lib/support/types";

export const runtime = "nodejs";

function toModelInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];

    if (!messages.length) {
      return Response.json({ error: "At least one message is required." }, { status: 400 });
    }

    const client = getOpenAIClient();

    const stream = await withRetry<any>(
      () =>
        client.responses.create({
          model: process.env.SUPPORT_CHAT_MODEL || "gpt-4.1-mini",
          instructions: SUPPORT_SYSTEM_PROMPT,
          input: toModelInput(messages),
          stream: true,
        }),
      { retries: 2, initialDelayMs: 400 }
    );

    const encoder = new TextEncoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta" && event.delta) {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate support response.";
    return Response.json({ error: message }, { status: 500 });
  }
}
