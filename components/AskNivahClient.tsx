"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { SendHorizonal, FileText, Bot, Sparkles } from "lucide-react";
import { NivahLogo } from "@/components/Icons";

interface Source {
  documentId: string;
  documentTitle: string;
  similarity: number;
}

interface AskResponse {
  answer: string;
  sources: Source[];
}

export function AskNivahClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Request failed: ${res.status}`);
      }

      const data: AskResponse = await res.json();
      setResponse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Ask Nivah</h1>
        <p className="text-zinc-400 mt-1">
          Ask questions about your documents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your documents..."
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 pr-14 text-white text-lg placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-3 bottom-3 p-3 rounded-xl transition-all bg-green-600 hover:bg-green-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          aria-label="Ask"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          ) : (
            <SendHorizonal className="w-5 h-5" />
          )}
        </button>
      </form>

      <p className="text-xs text-zinc-600 text-center -mt-4">
        Press Enter to ask, Shift+Enter for new line
      </p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Searching your documents...</p>
              <p className="text-zinc-600 text-sm mt-1">Retrieving relevant context and generating answer</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-500/30 rounded-2xl p-6 text-center bg-red-500/5">
          <p className="text-red-400">{error}</p>
          <button
            onClick={handleSubmit}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Answer</p>
                <p className="text-xs text-zinc-500">Powered by Gemini 2.5 Flash Lite</p>
              </div>
            </div>
            <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </div>
          </div>

          {response.sources.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Sources</p>
                  <p className="text-xs text-zinc-500">{response.sources.length} document{response.sources.length !== 1 ? "s" : ""} used</p>
                </div>
              </div>
              <div className="space-y-2">
                {response.sources.map((source) => (
                  <Link
                    key={source.documentId}
                    href={`/dashboard/documents/${source.documentId}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-white truncate transition-colors">
                        {source.documentTitle}
                      </span>
                    </div>
                    <span className="text-xs text-green-400 font-mono flex-shrink-0 ml-3">
                      {formatScore(source.similarity)} match
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {response.sources.length === 0 && !response.answer.includes("couldn't find") && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-center">
              <p className="text-yellow-400 text-sm">
                No direct sources were found, but the answer was generated from available context.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={() => {
                setQuestion("");
                setResponse(null);
                setError(null);
                inputRef.current?.focus();
              }}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
            >
              Ask another question
            </button>
          </div>
        </div>
      )}

      {!loading && !response && !error && (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <NivahLogo className="w-8 h-8" />
          </div>
          <p className="text-zinc-500 text-lg font-medium">
            Ask anything about your documents
          </p>
          <p className="text-zinc-600 mt-2 text-sm max-w-md mx-auto">
            Nivah searches your documents for relevant context and generates a grounded answer using AI.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-600">
            <Bot className="w-3.5 h-3.5" />
            <span>Answers are grounded in your documents only</span>
          </div>
        </div>
      )}
    </div>
  );
}
