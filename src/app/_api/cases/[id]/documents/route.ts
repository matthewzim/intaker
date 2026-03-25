/* ── GET  /api/cases/:id/documents — list documents ── */
/* ── POST /api/cases/:id/documents — upload a document ── */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const docs = db
    .prepare(
      "SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC"
    )
    .all(id);
  return NextResponse.json(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // Verify case exists
  const caseRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  if (!caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tag = (formData.get("tag") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Save file to disk
  const docId = uuid();
  const ext = path.extname(file.name);
  const filename = `${docId}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  // Save metadata to database
  db.prepare(
    `INSERT INTO documents (id, case_id, filename, original_name, mime_type, size, tag)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(docId, id, filename, file.name, file.type, file.size, tag);

  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
  return NextResponse.json(doc, { status: 201 });
}
