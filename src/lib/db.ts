/* ── SQLite database layer using better-sqlite3 ── */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "caseflow.db");

let _db: Database.Database | null = null;

/** Get or create the singleton database connection */
export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

/** Create tables if they don't exist */
function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Case',
      status TEXT NOT NULL DEFAULT 'new',
      legal_category TEXT,
      viability_score TEXT,
      viability_reasoning TEXT,
      summary TEXT,
      extracted_facts TEXT,
      client_name TEXT NOT NULL DEFAULT 'Client',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      size INTEGER NOT NULL DEFAULT 0,
      tag TEXT,
      ai_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
  `);
}
