-- Caseflow Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cases table: core entity for each legal matter
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Client information
  client_name TEXT NOT NULL,
  client_email TEXT,

  -- Case status workflow
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected')),

  -- AI-generated classification
  legal_category TEXT,
  legal_subcategory TEXT,

  -- AI viability assessment
  viability_score TEXT CHECK (viability_score IN ('strong', 'medium', 'weak')),
  viability_reasoning TEXT,

  -- AI-generated intake summary (markdown)
  summary TEXT,

  -- Structured facts extracted by AI (JSON)
  extracted_facts JSONB DEFAULT '{}'::jsonb,

  -- Whether initial intake is complete (triggers AI analysis)
  intake_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Message count tracker for auto-triggering analysis
  message_count INTEGER NOT NULL DEFAULT 0
);

-- Messages table: chat between client, AI, and lawyer
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

  -- Who sent this message
  role TEXT NOT NULL CHECK (role IN ('client', 'ai', 'lawyer')),

  -- Message content (plain text or markdown)
  content TEXT NOT NULL,

  -- Optional: message subtype for UI hints
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'summary_update'))
);

-- Documents table: files uploaded to a case
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,

  -- AI-generated document summary
  summary TEXT,

  -- Document tags (e.g., "contract", "evidence", "medical")
  tags TEXT[] DEFAULT '{}',

  -- Who uploaded (client or lawyer)
  uploaded_by TEXT NOT NULL DEFAULT 'client' CHECK (uploaded_by IN ('client', 'lawyer'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- Updated_at trigger for cases
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (disabled for MVP - no auth)
-- Enable these when you add authentication:
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
