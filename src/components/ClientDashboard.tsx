"use client";

import { useState, useEffect } from "react";
import type { Case } from "@/lib/types";
import CaseWorkspace from "./CaseWorkspace";
import { StatusBadge } from "./StatusBadge";

export default function ClientDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchCases = async () => {
    const res = await fetch("/api/cases");
    if (res.ok) setCases(await res.json());
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const createCase = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Client",
          title: "New Case",
        }),
      });
      if (res.ok) {
        const newCase = await res.json();
        setCases((prev) => [newCase, ...prev]);
        setActiveCaseId(newCase.id);
      }
    } finally {
      setCreating(false);
    }
  };

  // Show workspace if a case is selected
  if (activeCaseId) {
    return (
      <CaseWorkspace
        caseId={activeCaseId}
        role="client"
        onBack={() => {
          setActiveCaseId(null);
          fetchCases();
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Your Cases</h1>
          <p className="text-sm text-gray-400 mt-1">
            Start a new case or continue an existing one
          </p>
        </div>
        <button
          onClick={createCase}
          disabled={creating}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating..." : "+ New Case"}
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No cases yet
          </h2>
          <p className="text-gray-400 mb-6">
            Start by describing your legal situation. Our AI will guide you
            through the intake process.
          </p>
          <button
            onClick={createCase}
            disabled={creating}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Start Your First Case
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className="w-full text-left p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{c.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {c.message_count || 0} messages · Updated{" "}
                    {new Date(c.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
