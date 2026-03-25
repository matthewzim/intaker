"use client";

import { useState, useEffect, useCallback } from "react";
import type { Document } from "@/lib/types";

const TAG_OPTIONS = ["contract", "evidence", "correspondence", "medical", "financial", "other"];

export default function DocumentPanel({ caseId }: { caseId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTag, setSelectedTag] = useState("other");

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}/documents`);
    if (res.ok) setDocuments(await res.json());
  }, [caseId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tag", selectedTag);

    try {
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchDocs();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    return "📎";
  };

  return (
    <div className="p-4 space-y-4">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
        <div className="flex items-center gap-3 justify-center mb-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
          >
            {TAG_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
            {uploading ? "Uploading..." : "Choose File"}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs text-gray-400">
          PDFs, images, documents — max 10MB
        </p>
      </div>

      {/* File list */}
      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No documents uploaded yet
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <span className="text-lg">{getFileIcon(doc.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={`/api/upload/${doc.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 truncate block"
                >
                  {doc.original_name}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {formatSize(doc.size)}
                  </span>
                  {doc.tag && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                      {doc.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
