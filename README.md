# AI Chatbot + Support Desk Kit

Support assistant kit built with Next.js + TypeScript.

## Features
- Streaming AI support chat UI (`/support`) that calls `app/api/ai/support-chat/route.ts`
- Ticket escalation flow: converts chat transcript into a support ticket
- AI-generated summary per ticket thread (with fallback summary if AI is unavailable)
- Support team ticket queue with status updates (`open`, `in_progress`, `resolved`)
- Robust error handling + retry behavior in both chat and ticket operations
- Local JSON ticket persistence (`data/tickets.json`) for quick local setup

## Project Structure
- `app/support/page.tsx`
- `components/chat/ChatWindow.tsx`
- `components/chat/MessageBubble.tsx`
- `components/support/TicketForm.tsx`
- `components/support/TicketList.tsx`
- `app/api/ai/support-chat/route.ts`
- `app/api/support/tickets/route.ts`
- `app/api/support/tickets/[id]/route.ts`
- `lib/support/prompt.ts`

## Environment Requirements
Required:
- Node.js 20+
- `OPENAI_API_KEY`

Optional:
- `SUPPORT_CHAT_MODEL` (default: `gpt-4.1-mini`)
- `SUPPORT_SUMMARY_MODEL` (default: `SUPPORT_CHAT_MODEL`)

Copy `.env.example` to `.env.local` and fill values.

## Setup
1. Install dependencies:
```bash
npm install
```

2. Configure env:
```bash
cp .env.example .env.local
```
Then edit `.env.local` and set `OPENAI_API_KEY`.

3. Run development server:
```bash
npm run dev
```

4. Open:
- `http://localhost:3000/support` for chat + support queue

## How It Works
- Customer chats with AI in `ChatWindow`.
- Chat requests stream from `/api/ai/support-chat`.
- "Escalate to Ticket" opens `TicketForm`.
- Ticket create API (`/api/support/tickets`) summarizes the transcript and stores the ticket.
- Support team uses `TicketList` to review and update ticket status.

## Error and Retry Handling
- Client retry with exponential backoff for:
  - chat requests
  - ticket creation
  - ticket list/status API calls
- Manual chat retry button shown on failed response
- Server retry around OpenAI calls and fallback summary generation when AI summary fails

## Notes
- This kit currently stores tickets in `data/tickets.json` for local/demo usage.
- For production, replace file storage with a database and auth controls for support views.
