"use client";

import { useState, useEffect } from "react";
import type { Case } from "@/lib/types";
import CaseWorkspace from "./CaseWorkspace";
import { StatusBadge, ViabilityBadge } from "./StatusBadge";

export default function LawyerDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchCases = async () => {
    const res = await fetch("/api/cases");
    if (res.ok) setCases(await res.json());
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 5000);
    return () => clearInterval(interval);
  }, []);

  if (activeCaseId) {
    return (
      <CaseWorkspace
        caseId={activeCaseId}
        role="lawyer"
        onBack={() => {
          setActiveCaseId(null);
          fetchCases();
        }}
      />
    );
  }

  const filtered =
    filterStatus === "all"
      ? cases
      : cases.filter((c) => c.status === filterStatus);

  const statusCounts = cases.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Case Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          {cases.length} total case{cases.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "New", key: "new", color: "bg-blue-50 text-blue-700" },
          {
            label: "Reviewing",
            key: "reviewing",
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Accepted",
            key: "accepted",
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Rejected",
            key: "rejected",
            color: "bg-red-50 text-red-700",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() =>
              setFilterStatus(filterStatus === s.key ? "all" : s.key)
            }
            className={`p-3 rounded-xl border text-center transition-all ${
              filterStatus === s.key
                ? "border-gray-300 shadow-sm"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>
              {statusCounts[s.key] || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filter indicator */}
      {filterStatus !== "all" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-400">
            Filtering by: <strong className="text-gray-600">{filterStatus}</strong>
          </span>
          <button
            onClick={() => setFilterStatus("all")}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Case list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {filterStatus !== "all" ? "No matching cases" : "No cases yet"}
          </h2>
          <p className="text-gray-400">
            {filterStatus !== "all"
              ? "Try a different filter"
              : "Cases will appear here when clients begin intake"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className="w-full text-left p-5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{c.title}</h3>
                    <StatusBadge status={c.status} />
                    <ViabilityBadge score={c.viability_score} />
                  </div>
                  <p className="text-sm text-gray-400">
                    Client: {c.client_name} · {c.message_count || 0} messages
                  </p>
                  {c.legal_category && (
                    <p className="text-xs text-gray-400 mt-1">
                      Category: {c.legal_category}
                    </p>
                  )}
                  {c.summary && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {c.summary.slice(0, 150)}
                      {c.summary.length > 150 ? "..." : ""}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-300 text-right whitespace-nowrap">
                  {new Date(c.updated_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
