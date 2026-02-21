import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>AI Chatbot + Support Desk Kit</h1>
        <p style={{ color: "var(--muted)" }}>
          Start the end-user support assistant and support team ticket dashboard.
        </p>
        <Link href="/support">
          <button>Open Support Desk</button>
        </Link>
      </div>
    </main>
  );
}
