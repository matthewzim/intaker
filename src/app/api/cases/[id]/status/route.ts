/* ── PATCH /api/cases/:id/status — update case status ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CaseStatus } from "@/lib/types";

const VALID_STATUSES: CaseStatus[] = ["new", "reviewing", "accepted", "rejected"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const db = getDb();
  const result = db
    .prepare(
      "UPDATE cases SET status = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .run(status, id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const updated = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
