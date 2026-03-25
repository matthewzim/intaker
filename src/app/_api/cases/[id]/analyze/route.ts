/* ── POST /api/cases/:id/analyze — run AI analysis on a case ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  extractFacts,
  classifyCase,
  assessViability,
  generateSummary,
} from "@/lib/ai";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const caseRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Get all messages for context
  const messages = db
    .prepare(
      "SELECT sender, content FROM messages WHERE case_id = ? ORDER BY created_at ASC"
    )
    .all(id) as { sender: string; content: string }[];

  const conversation = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n");

  // Run all AI tasks in parallel
  const [factsRaw, classRaw, viabilityRaw, summary] = await Promise.all([
    extractFacts(conversation),
    classifyCase(conversation),
    assessViability(conversation),
    generateSummary(conversation),
  ]);

  // Parse JSON responses safely
  let facts = null;
  let category = null;
  let viabilityScore = null;
  let viabilityReasoning = null;

  try {
    facts = JSON.parse(factsRaw);
  } catch {
    facts = { error: "Could not parse facts" };
  }

  try {
    const cls = JSON.parse(classRaw);
    category = `${cls.category}${cls.subcategory ? " — " + cls.subcategory : ""}`;
  } catch {
    category = "Uncategorized";
  }

  try {
    const v = JSON.parse(viabilityRaw);
    viabilityScore = v.score || null;
    viabilityReasoning = v.reasoning || null;
  } catch {
    viabilityScore = null;
  }

  // Generate a title from the category
  const title = category !== "Uncategorized" ? category : "Legal Case";

  // Update the case with AI analysis
  db.prepare(
    `UPDATE cases SET
      title = ?,
      legal_category = ?,
      viability_score = ?,
      viability_reasoning = ?,
      summary = ?,
      extracted_facts = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    title,
    category,
    viabilityScore,
    viabilityReasoning,
    summary,
    JSON.stringify(facts),
    id
  );

  const updated = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
