/**
 * Seed script — populates the database with demo data.
 *
 * Usage: npm run seed
 */

const Database = require("better-sqlite3");
const { randomUUID } = require("crypto");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "caseflow.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
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

// ── Demo case 1: Employment dispute (analyzed) ──

const case1Id = randomUUID();
db.prepare(`INSERT INTO cases (id, title, status, legal_category, viability_score, viability_reasoning, summary, extracted_facts, client_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'), datetime('now', '-1 hour'))`).run(
  case1Id,
  "Employment Law — Wrongful Termination",
  "reviewing",
  "Employment Law — Wrongful Termination",
  "Strong",
  "The client has documentation of positive performance reviews shortly before termination, and the timing coincides with filing an HR complaint. This pattern suggests potential retaliation, which strengthens the claim significantly.",
  "**Facts:** The client, Sarah Chen, was employed as a Senior Marketing Manager at TechCorp Inc. for 4 years. She received consistently positive performance reviews, including a promotion 8 months before termination. She filed an HR complaint about discriminatory comments from her new supervisor in January 2024. She was terminated in March 2024, with the stated reason being 'restructuring,' though her position was filled by a new hire within 2 weeks.\n\n**Legal Issue:** Wrongful termination with potential retaliation claim under employment discrimination laws.\n\n**Risks:** The employer may argue legitimate business restructuring. The short time between complaint and termination strengthens the retaliation argument but needs corroborating evidence.\n\n**Missing Information:** Copies of performance reviews, the HR complaint filing, termination letter, any witnesses to discriminatory comments, and details of the new hire who filled the position.",
  JSON.stringify({
    parties: ["Sarah Chen (Employee/Complainant)", "TechCorp Inc. (Employer)", "New Supervisor (Alleged Discriminator)"],
    timeline: ["4 years of employment", "Promotion 8 months before termination", "January 2024: HR complaint filed", "March 2024: Terminated", "Position filled within 2 weeks"],
    key_events: ["Filed HR complaint about discriminatory comments", "Terminated under 'restructuring' pretense", "Position immediately refilled"],
    damages: ["Lost salary and benefits", "Career disruption", "Emotional distress"],
    jurisdiction: "California"
  }),
  "Sarah Chen"
);

// Messages for case 1
const case1Messages = [
  { sender: "ai", content: "Welcome! I'm here to help understand your legal situation. Please tell me what happened — take your time and share as much detail as you're comfortable with." },
  { sender: "client", content: "I was fired from my job and I think it was retaliation. I worked at TechCorp Inc. as a Senior Marketing Manager for 4 years." },
  { sender: "ai", content: "I'm sorry to hear that. Retaliation claims are serious. Can you tell me what you believe they were retaliating against? Did you file a complaint or report something before being terminated?" },
  { sender: "client", content: "Yes, I filed an HR complaint in January about my new supervisor making discriminatory comments about my ethnicity. Then in March they fired me saying it was due to restructuring." },
  { sender: "ai", content: "That timeline is important. Was your position actually eliminated, or was someone else hired to fill it? And how were your performance reviews before the termination?" },
  { sender: "client", content: "My reviews were always excellent — I even got promoted 8 months before this happened. And yes, they hired someone new for my exact role within two weeks of firing me." },
  { sender: "ai", content: "Thank you for sharing these details. The combination of positive reviews, a recent promotion, and your position being immediately refilled after a complaint creates a strong pattern. Do you have copies of your performance reviews and the HR complaint?" },
  { sender: "client", content: "I have my performance reviews saved. I also kept a copy of the HR complaint email. And I have my termination letter which just says restructuring." },
  { sender: "lawyer", content: "Sarah, I've reviewed your case summary. This looks like a strong retaliation claim. I'd like to schedule a call to discuss next steps. Can you also send over those documents you mentioned?" },
];

case1Messages.forEach((msg, i) => {
  db.prepare("INSERT INTO messages (id, case_id, sender, content, created_at) VALUES (?, ?, ?, ?, datetime('now', '-2 days', '+' || ? || ' hours'))").run(
    randomUUID(), case1Id, msg.sender, msg.content, i
  );
});

// ── Demo case 2: Personal injury (new, partial intake) ──

const case2Id = randomUUID();
db.prepare(`INSERT INTO cases (id, title, status, client_name, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now', '-1 hour'), datetime('now', '-30 minutes'))`).run(
  case2Id, "New Case", "new", "Marcus Johnson"
);

const case2Messages = [
  { sender: "ai", content: "Welcome! I'm here to help understand your legal situation. Please tell me what happened — take your time and share as much detail as you're comfortable with." },
  { sender: "client", content: "I was in a car accident last week. The other driver ran a red light and hit my car on the driver's side. I was taken to the hospital." },
  { sender: "ai", content: "I'm sorry to hear about your accident. Can you tell me more about your injuries? What medical treatment have you received so far?" },
  { sender: "client", content: "I have a fractured collarbone and whiplash. I've been to the ER and had follow-up visits. I can't work right now because of the pain." },
];

case2Messages.forEach((msg, i) => {
  db.prepare("INSERT INTO messages (id, case_id, sender, content, created_at) VALUES (?, ?, ?, ?, datetime('now', '-1 hour', '+' || ? || ' minutes'))").run(
    randomUUID(), case2Id, msg.sender, msg.content, i * 3
  );
});

// ── Demo case 3: Contract dispute (accepted) ──

const case3Id = randomUUID();
db.prepare(`INSERT INTO cases (id, title, status, legal_category, viability_score, viability_reasoning, summary, extracted_facts, client_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 days'), datetime('now', '-3 hours'))`).run(
  case3Id,
  "Contract Dispute — Breach of Service Agreement",
  "accepted",
  "Contract Dispute — Breach of Service Agreement",
  "Medium",
  "The client has a signed contract and evidence of non-delivery, but the vendor may argue force majeure or partial performance. The damages are clearly quantifiable, which helps the case.",
  "**Facts:** The client, Rivera Design Studio, contracted WebBuild Solutions for a custom e-commerce website. The contract specified a $45,000 total cost with delivery in 12 weeks. After 20 weeks and $30,000 paid, only a non-functional prototype was delivered. The vendor stopped responding to communications.\n\n**Legal Issue:** Breach of contract for failure to deliver agreed-upon services within the specified timeframe.\n\n**Risks:** The vendor may claim partial performance or blame scope changes. Need to verify if there were any contract modifications or change orders.\n\n**Missing Information:** Full contract document, all payment receipts, email communications showing delivery failures, and any change order documentation.",
  JSON.stringify({
    parties: ["Rivera Design Studio (Client)", "WebBuild Solutions (Vendor)"],
    timeline: ["Contract signed for $45,000", "12-week delivery deadline", "$30,000 paid over project", "20 weeks elapsed", "Non-functional prototype delivered", "Vendor became unresponsive"],
    key_events: ["Contract execution", "Missed 12-week deadline", "Non-functional delivery at week 20", "Vendor stopped responding"],
    damages: ["$30,000 paid for undelivered work", "Business losses from delayed e-commerce launch", "Cost of hiring replacement developer"],
    jurisdiction: "New York"
  }),
  "Maria Rivera"
);

console.log("✓ Database seeded successfully!");
console.log(`  - Case 1: ${case1Id} (Employment — Reviewing)`);
console.log(`  - Case 2: ${case2Id} (New intake — In progress)`);
console.log(`  - Case 3: ${case3Id} (Contract — Accepted)`);

db.close();
