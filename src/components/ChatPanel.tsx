"use client";

import { useState, useEffect, useRef } from "react";
import type { Message, MessageSender } from "@/lib/types";
import {
  listMessages,
  addMessage,
  getIntakeResponse,
  analyzeCase,
} from "@/lib/clientStore";

interface ChatPanelProps {
  caseId: string;
  sender: MessageSender;
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

  useEffect(() => {
    setMessages(listMessages(caseId));
  }, [caseId]);

  useEffect(() => {
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

  const triggerAnalysis = () => {
    setAnalysisTriggered(true);
    setAnalyzing(true);
    try {
      analyzeCase(caseId);
      onAnalysisComplete?.();
    } finally {
      setAnalyzing(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput("");
    setLoading(true);

    try {
      const userMsg = addMessage(caseId, content, sender);
      const updated = [...messages, userMsg];

      // Generate AI response when client sends a message
      if (sender === "client") {
        const clientCount = updated.filter((m) => m.sender === "client").length;
        const aiText = getIntakeResponse(clientCount);
        const aiMsg = addMessage(caseId, aiText, "ai");
        setMessages([...updated, aiMsg]);
      } else {
        setMessages(updated);
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
