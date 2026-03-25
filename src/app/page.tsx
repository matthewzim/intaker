"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";
import ClientDashboard from "@/components/ClientDashboard";
import LawyerDashboard from "@/components/LawyerDashboard";

export default function Home() {
  const [role, setRole] = useState<UserRole>("client");

  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="font-semibold text-gray-800 text-lg">
              Caseflow
            </span>
          </div>

          {/* Role toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setRole("client")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                role === "client"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setRole("lawyer")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                role === "lawyer"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Lawyer
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {role === "client" ? <ClientDashboard /> : <LawyerDashboard />}
      </main>
    </div>
  );
}
