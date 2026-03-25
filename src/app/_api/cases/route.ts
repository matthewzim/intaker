/* ── GET /api/cases — list all cases ── */
/* ── POST /api/cases — create a new case ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  const cases = db
    .prepare(
      `SELECT c.*, COUNT(m.id) as message_count
       FROM cases c
       LEFT JOIN messages m ON m.case_id = c.id
       GROUP BY c.id
       ORDER BY c.updated_at DESC`
    )
    .all();
  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const id = uuid();
  const clientName = body.client_name || "New Client";
  const title = body.title || "New Case";

  db.prepare(
    `INSERT INTO cases (id, title, client_name) VALUES (?, ?, ?)`
  ).run(id, title, clientName);

  // Add the initial AI greeting message
  const msgId = uuid();
  db.prepare(
    `INSERT INTO messages (id, case_id, sender, content) VALUES (?, ?, 'ai', ?)`
  ).run(
    msgId,
    id,
    "Welcome! I'm here to help understand your legal situation. Please tell me what happened — take your time and share as much detail as you're comfortable with."
  );

  const newCase = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  return NextResponse.json(newCase, { status: 201 });
}
