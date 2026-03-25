/* ── Client-side data store using localStorage ── */

import type { Case, Message, Document, CaseStatus } from "./types";

// ── Storage helpers ─────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function now(): string {
  return new Date().toISOString();
}

// ── Storage keys ─────────────────────────────────────────────────────────────

const CASES_KEY = "cf_cases";
const msgKey = (id: string) => `cf_msg_${id}`;
const docKey = (id: string) => `cf_doc_${id}`;
const fileKey = (id: string) => `cf_file_${id}`;

// ── Cases ────────────────────────────────────────────────────────────────────

export function listCases(): Case[] {
  const cases = load<Case[]>(CASES_KEY, []);
  return cases.map((c) => ({
    ...c,
    message_count: load<Message[]>(msgKey(c.id), []).length,
  }));
}

export function createCase(data: {
  client_name: string;
  title: string;
}): Case {
  const cases = load<Case[]>(CASES_KEY, []);
  const c: Case = {
    id: randomId(),
    title: data.title,
    status: "new",
    legal_category: null,
    viability_score: null,
    viability_reasoning: null,
    summary: null,
    extracted_facts: null,
    client_name: data.client_name,
    created_at: now(),
    updated_at: now(),
    message_count: 0,
  };
  save(CASES_KEY, [c, ...cases]);
  return c;
}

export function getCase(id: string): Case | null {
  const cases = load<Case[]>(CASES_KEY, []);
  const c = cases.find((x) => x.id === id);
  if (!c) return null;
  return { ...c, message_count: load<Message[]>(msgKey(id), []).length };
}

export function updateCase(
  id: string,
  updates: Partial<Omit<Case, "id" | "created_at" | "message_count">>
): Case {
  const cases = load<Case[]>(CASES_KEY, []);
  const updated = cases.map((c) =>
    c.id === id ? { ...c, ...updates, updated_at: now() } : c
  );
  save(CASES_KEY, updated);
  return getCase(id)!;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function listMessages(caseId: string): Message[] {
  return load<Message[]>(msgKey(caseId), []);
}

export function addMessage(
  caseId: string,
  content: string,
  sender: Message["sender"]
): Message {
  const messages = load<Message[]>(msgKey(caseId), []);
  const m: Message = {
    id: randomId(),
    case_id: caseId,
    sender,
    content,
    created_at: now(),
  };
  save(msgKey(caseId), [...messages, m]);
  // bump case updated_at
  const cases = load<Case[]>(CASES_KEY, []);
  save(
    CASES_KEY,
    cases.map((c) => (c.id === caseId ? { ...c, updated_at: now() } : c))
  );
  return m;
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function listDocuments(caseId: string): Document[] {
  return load<Document[]>(docKey(caseId), []);
}

export function addDocument(
  caseId: string,
  data: {
    original_name: string;
    mime_type: string;
    size: number;
    tag: string | null;
    dataUrl: string;
  }
): Document {
  const docs = load<Document[]>(docKey(caseId), []);
  const id = randomId();
  const doc: Document = {
    id,
    case_id: caseId,
    filename: id,
    original_name: data.original_name,
    mime_type: data.mime_type,
    size: data.size,
    tag: data.tag,
    ai_summary: null,
    created_at: now(),
  };
  try {
    localStorage.setItem(fileKey(id), data.dataUrl);
  } catch {
    // Storage full — skip saving file data
  }
  save(docKey(caseId), [...docs, doc]);
  return doc;
}

export function getFileUrl(docId: string): string {
  if (typeof window === "undefined") return "#";
  return localStorage.getItem(fileKey(docId)) || "#";
}

// ── Mock AI responses ─────────────────────────────────────────────────────────

export function getIntakeResponse(clientMessageCount: number): string {
  const responses = [
    "Thank you for sharing that. Can you tell me who else was involved in this situation? Were there any witnesses?",
    "I understand. When did this first occur, and how long has this been going on?",
    "That's helpful context. Were there any financial losses or damages you've experienced as a result?",
    "Thank you. Do you have any documentation related to this — emails, contracts, photos, or other records?",
    "I appreciate you sharing all of this. Where did these events take place? This helps determine which jurisdiction applies.",
    "Thank you for providing all these details. I believe I have enough information to create an initial case summary for review by our legal team. They'll follow up with any additional questions.",
  ];
  return responses[Math.min(Math.floor(clientMessageCount / 2), responses.length - 1)];
}

export function analyzeCase(caseId: string): Case {
  return updateCase(caseId, {
    status: "reviewing",
    legal_category: "Employment Law",
    viability_score: "Medium",
    viability_reasoning:
      "The case presents some merit based on the facts described, but additional documentation and witness statements would strengthen the position. Further investigation is recommended.",
    summary:
      "**Facts:** The client has described a situation involving a dispute that requires legal attention. Key parties have been identified and a timeline of events has been established.\n\n**Legal Issue:** This appears to be a workplace/contractual matter that falls under employment or contract law. The specific nature of the claim requires further documentation review.\n\n**Risks:** The case has moderate risk factors. The strength of the claim depends on available documentation and witness testimony. Statute of limitations should be verified.\n\n**Missing Information:** Additional documentation is needed, including any written agreements, correspondence, and records of damages. Witness statements would help corroborate the client's account.",
    extracted_facts: JSON.stringify({
      parties: ["Client (Complainant)", "Employer / Other Party"],
      timeline: ["Initial incident reported", "Ongoing situation described"],
      key_events: ["Primary incident occurred", "Client sought legal help"],
      damages: [
        "Potential financial losses described",
        "Emotional distress mentioned",
      ],
      jurisdiction: "To be determined",
    }),
  });
}
