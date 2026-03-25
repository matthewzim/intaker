/* ── AI helper functions using OpenAI API ── */

import OpenAI from "openai";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/** Generate a chat completion and return the text */
async function complete(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  // If no API key, return a mock response for demo purposes
  if (!process.env.OPENAI_API_KEY) {
    return getMockResponse(systemPrompt);
  }
  const client = getClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });
  return res.choices[0]?.message?.content || "";
}

/* ── Intake conversation ── */

export async function getIntakeResponse(
  conversationHistory: { role: string; content: string }[]
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockIntakeResponse(conversationHistory.length);
  }
  const client = getClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system" as const,
        content: `You are a legal intake assistant. Your job is to gather facts about a potential legal case through a conversational interview.

Rules:
- Be empathetic but professional
- Ask one focused follow-up question at a time
- Cover: what happened, who was involved, when it happened, where it happened, what damages/harm occurred, and any evidence available
- Do NOT give legal advice
- Keep responses concise (2-3 sentences max)
- After gathering sufficient information (5-10 exchanges), let the client know you have enough to create a summary`,
      },
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  return res.choices[0]?.message?.content || "I understand. Could you tell me more?";
}

/* ── Extraction ── */

export async function extractFacts(conversation: string): Promise<string> {
  return complete(
    `Extract structured legal facts from the following conversation. Return ONLY valid JSON with these fields:
- parties: string[] (names/descriptions of all parties involved)
- timeline: string[] (chronological events with dates if available)
- key_events: string[] (most important events)
- damages: string[] (harm, losses, injuries described)
- jurisdiction: string (location/jurisdiction if mentioned, or "Unknown")`,
    conversation
  );
}

/* ── Classification ── */

export async function classifyCase(conversation: string): Promise<string> {
  return complete(
    `Classify this legal issue into a category and subcategory. Return ONLY valid JSON with:
- category: string (e.g., "Employment Law", "Personal Injury", "Contract Dispute", "Family Law", "Criminal Defense", "Real Estate", "Immigration", "Intellectual Property")
- subcategory: string (more specific classification)`,
    conversation
  );
}

/* ── Viability ── */

export async function assessViability(conversation: string): Promise<string> {
  return complete(
    `Assess the likely legal strength of this case based on the facts provided. Return ONLY valid JSON with:
- score: "Strong" | "Medium" | "Weak"
- reasoning: string (2-3 sentence explanation of the assessment)`,
    conversation
  );
}

/* ── Summary ── */

export async function generateSummary(conversation: string): Promise<string> {
  return complete(
    `Generate a concise, professional intake summary for a lawyer reviewing this case. Include sections:
- Facts: Key factual findings
- Legal Issue: Primary legal issue and category
- Risks: Potential risks or weaknesses
- Missing Information: What else the lawyer should ask about

Format as clean paragraphs, not JSON. Keep it under 300 words.`,
    conversation
  );
}

/* ── Document summary ── */

export async function summarizeDocument(
  filename: string,
  textContent: string
): Promise<string> {
  return complete(
    `Summarize this document and extract legally relevant facts. The document is named "${filename}". Provide a concise summary focusing on information that would be relevant to a legal case.`,
    textContent
  );
}

/* ── Suggest reply ── */

export async function suggestReply(
  conversation: string,
  role: "client" | "lawyer"
): Promise<string> {
  const perspective =
    role === "lawyer"
      ? "a lawyer responding to a client"
      : "a client responding to their lawyer";
  return complete(
    `Suggest a brief, professional reply from the perspective of ${perspective}. Keep it under 100 words. Return just the suggested text, no quotes or labels.`,
    conversation
  );
}

/* ── Mock responses for demo without API key ── */

function getMockIntakeResponse(messageCount: number): string {
  const responses = [
    "Thank you for sharing that. Can you tell me who else was involved in this situation? Were there any witnesses?",
    "I understand. When did this first occur, and how long has this been going on?",
    "That's helpful context. Were there any financial losses or damages you've experienced as a result?",
    "Thank you. Do you have any documentation related to this — emails, contracts, photos, or other records?",
    "I appreciate you sharing all of this. Where did these events take place? This helps determine which jurisdiction applies.",
    "Thank you for providing all these details. I believe I have enough information to create an initial case summary for review by our legal team. They'll follow up with any additional questions.",
  ];
  const idx = Math.min(Math.floor(messageCount / 2), responses.length - 1);
  return responses[idx];
}

function getMockResponse(systemPrompt: string): string {
  if (systemPrompt.includes("Extract structured legal facts")) {
    return JSON.stringify({
      parties: ["Client (Complainant)", "Employer / Other Party"],
      timeline: ["Initial incident reported", "Ongoing situation described"],
      key_events: ["Primary incident occurred", "Client sought legal help"],
      damages: ["Potential financial losses described", "Emotional distress mentioned"],
      jurisdiction: "To be determined",
    });
  }
  if (systemPrompt.includes("Classify this legal issue")) {
    return JSON.stringify({
      category: "Employment Law",
      subcategory: "Workplace Dispute",
    });
  }
  if (systemPrompt.includes("Assess the likely legal strength")) {
    return JSON.stringify({
      score: "Medium",
      reasoning:
        "The case presents some merit based on the facts described, but additional documentation and witness statements would strengthen the position. Further investigation is recommended.",
    });
  }
  if (systemPrompt.includes("Generate a concise, professional intake summary")) {
    return `**Facts:** The client has described a situation involving a dispute that requires legal attention. Key parties have been identified and a timeline of events has been established.

**Legal Issue:** This appears to be a workplace/contractual matter that falls under employment or contract law. The specific nature of the claim requires further documentation review.

**Risks:** The case has moderate risk factors. The strength of the claim depends on available documentation and witness testimony. Statute of limitations should be verified.

**Missing Information:** Additional documentation is needed, including any written agreements, correspondence, and records of damages. Witness statements would help corroborate the client's account.`;
  }
  if (systemPrompt.includes("Summarize this document")) {
    return "This document contains information potentially relevant to the case. Key details should be reviewed by the assigned attorney for legal significance.";
  }
  if (systemPrompt.includes("Suggest a brief")) {
    return "Thank you for the update. I'd like to discuss this further and understand the next steps we should take.";
  }
  return "Response generated for review.";
}
