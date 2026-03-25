"use client";

import { useState, useEffect, useCallback } from "react";
import type { Case, CaseStatus, MessageSender } from "@/lib/types";
import ChatPanel from "./ChatPanel";
import DocumentPanel from "./DocumentPanel";
import CaseSummary from "./CaseSummary";
import { StatusBadge } from "./StatusBadge";
import { getCase, updateCase, analyzeCase } from "@/lib/clientStore";

interface CaseWorkspaceProps {
  caseId: string;
  role: "client" | "lawyer";
  onBack: () => void;
}

const STATUS_OPTIONS: CaseStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
];

export default function CaseWorkspace({
  caseId,
  role,
  onBack,
}: CaseWorkspaceProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "documents">("chat");
  const [rightTab, setRightTab] = useState<"summary" | "documents">("summary");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const refresh = useCallback(() => {
    const c = getCase(caseId);
    if (c) setCaseData(c);
  }, [caseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = (status: CaseStatus) => {
    const updated = updateCase(caseId, { status });
    setCaseData(updated);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    try {
      const updated = analyzeCase(caseId);
      setCaseData(updated);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading case...
      </div>
    );
  }

  const senderType: MessageSender = role === "client" ? "client" : "lawyer";

  // Client view: single column with tabs
  if (role === "client") {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <h2 className="font-semibold text-gray-800 flex-1">
            {caseData.title}
          </h2>
          <StatusBadge status={caseData.status} />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 px-4 flex gap-1">
          {(["chat", "documents"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "chat" ? "Chat" : "Documents"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" ? (
            <ChatPanel
              caseId={caseId}
              sender={senderType}
              enableAutoAnalysis
              onAnalysisComplete={refresh}
            />
          ) : (
            <DocumentPanel caseId={caseId} />
          )}
        </div>
      </div>
    );
  }

  // Lawyer view: split layout
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <h2 className="font-semibold text-gray-800 flex-1">{caseData.title}</h2>
        <select
          value={caseData.status}
          onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-300"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <StatusBadge status={caseData.status} />
      </div>

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 border-r border-gray-100 flex flex-col">
          <ChatPanel caseId={caseId} sender={senderType} />
        </div>

        {/* Right: Summary + Documents */}
        <div className="w-[420px] flex flex-col">
          {/* Right tabs */}
          <div className="border-b border-gray-100 px-4 flex gap-1">
            {(["summary", "documents"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  rightTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "summary" ? "Summary" : "Documents"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "summary" ? (
              <CaseSummary
                caseData={caseData}
                onRefreshAnalysis={runAnalysis}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <DocumentPanel caseId={caseId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
