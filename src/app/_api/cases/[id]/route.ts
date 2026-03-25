/* ── GET /api/cases/:id — get a single case ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*, COUNT(m.id) as message_count
       FROM cases c
       LEFT JOIN messages m ON m.case_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`
    )
    .get(id);

  if (!row) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
