"use client";

import type { Case, ExtractedFacts } from "@/lib/types";
import { StatusBadge, ViabilityBadge } from "./StatusBadge";

interface CaseSummaryProps {
  caseData: Case;
  onRefreshAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export default function CaseSummary({
  caseData,
  onRefreshAnalysis,
  isAnalyzing,
}: CaseSummaryProps) {
  let facts: ExtractedFacts | null = null;
  try {
    if (caseData.extracted_facts) {
      facts = JSON.parse(caseData.extracted_facts);
    }
  } catch {
    // ignore parse errors
  }

  return (
    <div className="p-4 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{caseData.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Client: {caseData.client_name}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={caseData.status} />
          <ViabilityBadge score={caseData.viability_score} />
        </div>
      </div>

      {/* Category */}
      {caseData.legal_category && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Legal Category
          </h3>
          <p className="text-sm text-gray-700">{caseData.legal_category}</p>
        </div>
      )}

      {/* Viability reasoning */}
      {caseData.viability_reasoning && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Viability Assessment
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {caseData.viability_reasoning}
          </p>
        </div>
      )}

      {/* AI Summary */}
      {caseData.summary ? (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Case Summary
          </h3>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
            {caseData.summary}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            No AI summary generated yet. Continue the conversation or trigger
            analysis manually.
          </p>
        </div>
      )}

      {/* Extracted Facts */}
      {facts && !("error" in facts) && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Extracted Facts
          </h3>

          {facts.parties && facts.parties.length > 0 && (
            <FactSection title="Parties" items={facts.parties} />
          )}
          {facts.timeline && facts.timeline.length > 0 && (
            <FactSection title="Timeline" items={facts.timeline} />
          )}
          {facts.key_events && facts.key_events.length > 0 && (
            <FactSection title="Key Events" items={facts.key_events} />
          )}
          {facts.damages && facts.damages.length > 0 && (
            <FactSection title="Damages" items={facts.damages} />
          )}
          {facts.jurisdiction && (
            <div>
              <span className="text-xs font-medium text-gray-500">
                Jurisdiction:
              </span>
              <span className="text-sm text-gray-600 ml-1">
                {facts.jurisdiction}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Refresh button */}
      {onRefreshAnalysis && (
        <button
          onClick={onRefreshAnalysis}
          disabled={isAnalyzing}
          className="w-full py-2 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 transition-colors border border-indigo-100"
        >
          {isAnalyzing ? "Analyzing..." : "Re-run AI Analysis"}
        </button>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-300 pt-2 border-t border-gray-100">
        <p>Created: {new Date(caseData.created_at).toLocaleString()}</p>
        <p>Updated: {new Date(caseData.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

function FactSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500">{title}:</span>
      <ul className="mt-1 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
            <span className="text-gray-300 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
