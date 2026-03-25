/* ── GET  /api/cases/:id/messages — list messages ── */
/* ── POST /api/cases/:id/messages — send a message ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getIntakeResponse } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const messages = db
    .prepare("SELECT * FROM messages WHERE case_id = ? ORDER BY created_at ASC")
    .all(id);
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { content, sender = "client" } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const db = getDb();

  // Verify case exists
  const caseRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Save the user message
  const msgId = uuid();
  db.prepare(
    "INSERT INTO messages (id, case_id, sender, content) VALUES (?, ?, ?, ?)"
  ).run(msgId, id, sender, content);

  // Update case timestamp
  db.prepare("UPDATE cases SET updated_at = datetime('now') WHERE id = ?").run(id);

  const savedMsg = db.prepare("SELECT * FROM messages WHERE id = ?").get(msgId);

  // If the sender is a client, generate an AI follow-up response
  let aiMsg = null;
  if (sender === "client") {
    const allMessages = db
      .prepare(
        "SELECT sender, content FROM messages WHERE case_id = ? ORDER BY created_at ASC"
      )
      .all(id) as { sender: string; content: string }[];

    // Build conversation history for the AI
    const history = allMessages.map((m) => ({
      role: m.sender === "client" ? "user" : "assistant",
      content: m.content,
    }));

    const aiResponse = await getIntakeResponse(history);
    const aiMsgId = uuid();
    db.prepare(
      "INSERT INTO messages (id, case_id, sender, content) VALUES (?, ?, 'ai', ?)"
    ).run(aiMsgId, id, aiResponse);

    aiMsg = db.prepare("SELECT * FROM messages WHERE id = ?").get(aiMsgId);
  }

  return NextResponse.json({
    message: savedMsg,
    ai_response: aiMsg,
  });
}
