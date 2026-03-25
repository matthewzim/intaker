/* ── Caseflow shared types ── */

export type CaseStatus = "new" | "reviewing" | "accepted" | "rejected";
export type ViabilityScore = "Strong" | "Medium" | "Weak" | null;
export type UserRole = "client" | "lawyer";
export type MessageSender = "client" | "lawyer" | "ai";

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  legal_category: string | null;
  viability_score: ViabilityScore;
  viability_reasoning: string | null;
  summary: string | null;
  extracted_facts: string | null; // JSON string
  client_name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  case_id: string;
  sender: MessageSender;
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  tag: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface ExtractedFacts {
  parties: string[];
  timeline: string[];
  key_events: string[];
  damages: string[];
  jurisdiction: string;
}
