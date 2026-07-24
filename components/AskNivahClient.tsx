"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  SendHorizonal,
  FileText,
  Bot,
  User,
  Plus,
  History,
  Trash2,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NivahMascot } from "@/components/NivahMascot";

interface Source {
  documentId: string;
  documentTitle: string;
  similarity: number;
}

interface Message {
  id: string;
  type: "question" | "answer" | "error";
  content: string;
  sources?: Source[];
}

interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export function AskNivahClient() {
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const loadSession = useCallback(
    async (sessionId: string) => {
      setShowHistory(false);
      setCurrentSessionId(sessionId);
      setMessages([]);
      setLoading(true);

      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const loaded: Message[] = data.messages.map(
            (m: { id: string; role: string; content: string; sources: Source[] | null }) => ({
              id: m.id,
              type: m.role === "USER" ? "question" : "answer",
              content: m.content,
              sources: m.sources ?? undefined,
            }),
          );
          setMessages(loaded);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadSessions = useCallback(async () => {
    if (sessionsLoaded) return;
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
      setSessionsLoaded(true);
    }
  }, [sessionsLoaded]);

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId) {
      startTransition(() => {
        setShowHistory(false);
        setCurrentSessionId(sessionId);
        setMessages([]);
        setLoading(true);
      });
      fetch(`/api/chat/sessions/${sessionId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          const loaded: Message[] = (data.messages || []).map(
            (m: { id: string; role: string; content: string; sources: Source[] | null }) => ({
              id: m.id,
              type: m.role === "USER" ? "question" : "answer",
              content: m.content,
              sources: m.sources ?? undefined,
            }),
          );
          setMessages(loaded);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (!sessionsLoaded) {
      fetch("/api/chat/sessions")
        .then((res) => res.json())
        .then((data) => setSessions(data.sessions))
        .catch(() => {})
        .finally(() => {
          setSessionsLoading(false);
          setSessionsLoaded(true);
        });
    }
  }, [searchParams, sessionsLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const newChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    setQuestion("");
    inputRef.current?.focus();
  }, []);

  const deleteSession = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent, sessionId: string) => {
      e.stopPropagation();
      e.preventDefault();

      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          if (currentSessionId === sessionId) {
            newChat();
          }
        }
      } catch {
        // ignore
      }
    },
    [currentSessionId, newChat],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const questionMsg: Message = {
      id: crypto.randomUUID(),
      type: "question",
      content: trimmed,
    };

    setMessages((prev) => [...prev, questionMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          sessionId: currentSessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      setCurrentSessionId(data.sessionId);

      const answerMsg: Message = {
        id: crypto.randomUUID(),
        type: "answer",
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, answerMsg]);
      loadSessions();
    } catch (e) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        type: "error",
        content: e instanceof Error ? e.message : "Failed to get answer",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {showHistory && (
        <div className="w-72 flex-shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsLoading && (
              <div className="flex items-center justify-center py-8">
                <svg className="w-5 h-5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            )}
            {!sessionsLoading && sessions.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-8">No conversations yet</p>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all group",
                  currentSessionId === session.id
                    ? "bg-green-500/10 border border-green-500/20 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{session.title}</span>
                <span
                  onClick={(e) => deleteSession(e, session.id)}
                  className="p-1 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                  role="button"
                  tabIndex={0}
                  aria-label="Delete session"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { deleteSession(e, session.id); } }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-zinc-800">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white">Ask Nivah</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Ask questions about your documents</p>
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              showHistory
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white",
            )}
            aria-label="Toggle history"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!hasMessages && !loading && (
            <div className="border border-zinc-800 rounded-2xl p-12 text-center">
              <div className="mx-auto mb-6">
                <NivahMascot size="lg" emotion={question ? "listening" : "idle"} inputRef={inputRef} />
              </div>
              <p className="text-zinc-500 text-lg font-medium">Ask anything about your documents</p>
              <p className="text-zinc-600 mt-2 text-sm max-w-md mx-auto">
                Nivah searches your documents for relevant context and generates a grounded answer using AI.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-600">
                <Bot className="w-3.5 h-3.5" />
                <span>Answers are grounded in your documents only</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.type === "question" && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-green-600/10 border border-green-600/20 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                    <p className="text-white">{msg.content}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {msg.type === "answer" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <NivahMascot size="sm" emotion="happy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-5">
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Sources
                          </p>
                          <div className="space-y-1.5">
                            {msg.sources.map((source) => (
                              <Link
                                key={source.documentId}
                                href={`/dashboard/documents/${source.documentId}`}
                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all group"
                              >
                                <span className="text-sm text-zinc-400 group-hover:text-white truncate">
                                  {source.documentTitle}
                                </span>
                                <span className="text-xs text-green-400/70 font-mono flex-shrink-0 ml-2">
                                  {formatScore(source.similarity)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {msg.type === "error" && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="border border-red-500/30 rounded-2xl rounded-tl-sm p-4 bg-red-500/5">
                    <p className="text-red-400 text-sm">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <NivahMascot size="sm" emotion="thinking" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="relative mt-4 flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="hidden sm:block flex-shrink-0 pb-1.5">
              <NivahMascot size="sm" emotion={loading ? "thinking" : question ? "listening" : "idle"} inputRef={inputRef} />
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3.5 pr-14 text-white text-base placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
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
                className="absolute right-2.5 bottom-2.5 p-2.5 rounded-xl transition-all bg-green-600 hover:bg-green-700 text-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                aria-label="Ask"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                ) : (
                  <SendHorizonal className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-1.5 flex-shrink-0">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
