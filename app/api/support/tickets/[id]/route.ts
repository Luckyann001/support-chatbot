import { NextRequest } from "next/server";
import { updateTicketStatus } from "@/lib/support/tickets-store";
import type { TicketStatus } from "@/lib/support/types";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved"];

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { status?: TicketStatus };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const ticket = await updateTicketStatus(id, body.status);
    if (!ticket) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    return Response.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update ticket.";
    return Response.json({ error: message }, { status: 500 });
  }
}
