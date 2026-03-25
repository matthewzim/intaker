"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message, MessageSender } from "@/lib/types";

interface ChatPanelProps {
  caseId: string;
  sender: MessageSender;
  /** If true, auto-trigger analysis after enough messages */
  enableAutoAnalysis?: boolean;
  onAnalysisComplete?: () => void;
}

export default function ChatPanel({
  caseId,
  sender,
  enableAutoAnalysis = false,
  onAnalysisComplete,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }, [caseId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-trigger analysis after enough client messages
  useEffect(() => {
    if (!enableAutoAnalysis || analysisTriggered) return;
    const clientMsgCount = messages.filter((m) => m.sender === "client").length;
    if (clientMsgCount >= 5) {
      triggerAnalysis();
    }
  }, [messages, enableAutoAnalysis, analysisTriggered]);

  const triggerAnalysis = async () => {
    setAnalysisTriggered(true);
    setAnalyzing(true);
    try {
      await fetch(`/api/cases/${caseId}/analyze`, { method: "POST" });
      onAnalysisComplete?.();
    } finally {
      setAnalyzing(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/cases/${caseId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sender }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const updated = [...prev, data.message];
          if (data.ai_response) updated.push(data.ai_response);
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSenderLabel = (s: MessageSender) => {
    if (s === "client") return "Client";
    if (s === "lawyer") return "Lawyer";
    return "AI Assistant";
  };

  const getSenderStyle = (s: MessageSender) => {
    if (s === "client") return "bg-blue-50 border-blue-100";
    if (s === "lawyer") return "bg-purple-50 border-purple-100";
    return "bg-gray-50 border-gray-100";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <span className="text-[11px] text-gray-400 mb-1 font-medium">
              {getSenderLabel(msg.sender)}
            </span>
            <div
              className={`rounded-xl px-4 py-3 text-sm border ${getSenderStyle(msg.sender)} max-w-[85%] ${
                msg.sender === "client" ? "self-end" : "self-start"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
            Thinking...
          </div>
        )}
        {analyzing && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-600">
            Analyzing case and generating summary...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-100 p-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            sender === "client"
              ? "Describe your situation..."
              : "Send a message to the client..."
          }
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
