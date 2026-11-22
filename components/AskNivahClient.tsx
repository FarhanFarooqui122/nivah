"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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

const FALLBACK_ANSWER = "I couldn't find that information in your documents.";

export function AskNivahClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [streamingStarted, setStreamingStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const requestedSessionRef = useRef<string | null>(null);
  const processedSessionRef = useRef<string | null>(null);
  const epochRef = useRef(0);
  const streamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => streamAbortRef.current?.abort();
  }, []);

  const loadSession = useCallback(
    async (sessionId: string) => {
      setShowHistory(false);
      epochRef.current++;
      streamAbortRef.current?.abort();
      setCurrentSessionId(sessionId);
      setMessages([]);
      setLoading(true);
      requestedSessionRef.current = sessionId;

      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
        if (requestedSessionRef.current !== sessionId) return;
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
        if (requestedSessionRef.current === sessionId) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const loadSessions = useCallback(async (force = false) => {
    if (!force && sessionsLoaded) return;
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
    if (sessionsLoaded) return;
    fetch("/api/chat/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions))
      .catch(() => {})
      .finally(() => {
        setSessionsLoading(false);
        setSessionsLoaded(true);
      });
  }, [sessionsLoaded]);

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId || processedSessionRef.current === sessionId) return;
    processedSessionRef.current = sessionId;
    epochRef.current++;
    streamAbortRef.current?.abort();
    requestedSessionRef.current = sessionId;
    startTransition(() => {
      setShowHistory(false);
      setCurrentSessionId(sessionId);
      setMessages([]);
      setLoading(true);
    });
    fetch(`/api/chat/sessions/${sessionId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (requestedSessionRef.current !== sessionId) return;
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
      .catch(() => {
        if (requestedSessionRef.current !== sessionId) return;
        setMessages([
          {
            id: crypto.randomUUID(),
            type: "error",
            content: "Failed to load this conversation.",
          },
        ]);
      })
      .finally(() => {
        if (requestedSessionRef.current === sessionId) setLoading(false);
      });
  }, [searchParams]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const msgs = container.querySelectorAll("[data-message]");
    if (msgs.length > 0) {
      (msgs[msgs.length - 1] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const newChat = useCallback(() => {
    epochRef.current++;
    streamAbortRef.current?.abort();
    setCurrentSessionId(null);
    setMessages([]);
    setQuestion("");
    setLoading(false);
    requestedSessionRef.current = null;
    processedSessionRef.current = null;
    router.replace("/dashboard/ask", { scroll: false });
    inputRef.current?.focus();
  }, [router]);

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

    const answerMsg: Message = {
      id: crypto.randomUUID(),
      type: "answer",
      content: "",
      sources: [],
    };

    const epochAtSubmit = epochRef.current;

    streamAbortRef.current?.abort();
    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    setMessages((prev) => [...prev, questionMsg, answerMsg]);
    setQuestion("");
    setLoading(true);
    setStreamingStarted(false);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          sessionId: currentSessionId,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let message = `Request failed: ${res.status}`;
        try {
          const err = await res.json();
          message = err.error || message;
        } catch {
          // keep fallback message
        }
        throw new Error(message);
      }

      if (!res.body) throw new Error("Streaming not supported");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotDelta = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          let event: { type: string; text?: string; sessionId?: string; sources?: Source[]; error?: string };
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (event.type === "meta") {
            if (event.sessionId && epochRef.current === epochAtSubmit) {
              setCurrentSessionId(event.sessionId);
            }
            if (event.sources) {
              setMessages((prev) =>
                prev.map((m) => (m.id === answerMsg.id ? { ...m, sources: event.sources! } : m)),
              );
            }
          } else if (event.type === "delta" && event.text) {
            gotDelta = true;
            setStreamingStarted(true);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === answerMsg.id ? { ...m, content: m.content + event.text! } : m,
              ),
            );
          } else if (event.type === "error") {
            throw new Error(event.error || "Failed to get answer");
          }
        }
      }

      if (!gotDelta) {
        setMessages((prev) =>
          prev.map((m) => (m.id === answerMsg.id ? { ...m, content: FALLBACK_ANSWER } : m)),
        );
      }
      loadSessions(true);
    } catch (e) {
      if (abortController.signal.aborted) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === answerMsg.id
            ? { ...m, type: "error", content: e instanceof Error ? e.message : "Failed to get answer" }
            : m,
        ),
      );
    } finally {
      if (streamAbortRef.current === abortController && epochRef.current === epochAtSubmit) {
        setLoading(false);
      }
    }
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {showHistory && (
        <div className="fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col overflow-hidden border-r-2 border-[var(--color-border)] bg-zinc-900 shadow-2xl md:relative md:inset-auto md:z-auto md:w-72 md:max-w-none md:flex-shrink-0 md:border-2">
          <div className="flex items-center justify-between border-b-2 border-[var(--color-border)] p-4">
            <h2 className="font-display flex items-center gap-2 text-sm uppercase text-white">
              <History className="w-4 h-4" />
              History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="border-2 border-transparent p-1 text-zinc-400 transition-colors hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white"
              aria-label="Close history"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {sessionsLoading && (
              <div className="flex items-center justify-center py-8">
                <svg className="w-5 h-5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            )}
            {!sessionsLoading && sessions.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">No conversations yet</p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => loadSession(session.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadSession(session.id); } }}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-2 border-2 px-3 py-2.5 text-left transition-all",
                  currentSessionId === session.id
                    ? "border-[var(--color-border)] bg-primary-vivid text-white shadow-[2px_2px_0_0_var(--color-border)]"
                    : "border-transparent text-zinc-400 hover:border-[var(--color-border)] hover:bg-zinc-800 hover:text-white",
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <span
                  onClick={(e) => deleteSession(e, session.id)}
                  className="cursor-pointer border-2 border-transparent p-1 text-zinc-500 opacity-0 transition-all hover:border-red-500 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 md:group-focus-within:opacity-100"
                  role="button"
                  tabIndex={0}
                  aria-label="Delete session"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { deleteSession(e, session.id); } }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-[var(--color-border)] p-2">
            <button
              onClick={newChat}
              className="flex w-full items-center gap-2 border-2 border-[var(--color-border)] px-3 py-2.5 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex flex-shrink-0 items-center justify-between gap-3 border-b-2 border-[var(--color-border)] pb-3">
          <div className="min-w-0">
            <p className="kicker">Retrieval-augmented chat</p>
            <h1 className="headline mt-1 text-2xl text-white sm:text-3xl">Ask Nivah</h1>
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "border-2 p-2.5 transition-all",
              showHistory
                ? "border-[var(--color-border)] bg-primary-vivid text-white shadow-[2px_2px_0_0_var(--color-border)]"
                : "border-[var(--color-border)] bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white",
            )}
            aria-label="Toggle history"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
          {!hasMessages && !loading && (
            <div className="border-2 border-dashed border-[var(--color-border)] p-8 text-center sm:p-12">
              <div className="mx-auto mb-6">
                <NivahMascot size="lg" emotion={question ? "listening" : "idle"} inputRef={inputRef} />
              </div>
              <p className="font-display text-xl uppercase text-white">Ask anything about your documents</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                Nivah searches your documents for relevant context and generates a grounded answer using AI.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 border-2 border-[var(--color-border)] bg-zinc-900 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-zinc-400">
                <Bot className="w-3.5 h-3.5" />
                <span>Answers are grounded in your documents only</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} data-message>
              {msg.type === "question" && (
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-[80%] border-2 border-[var(--color-border)] bg-purple-500/10 px-5 py-3 shadow-[3px_3px_0_0_var(--color-primary-vivid)]">
                    <p className="text-white">{msg.content}</p>
                  </div>
                  <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[var(--color-border)] bg-primary-vivid">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {msg.type === "answer" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <NivahMascot size="sm" emotion="happy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="ai-border p-5">
                        <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">{msg.content}</p>
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 border-2 border-[var(--color-border)] bg-zinc-900 p-4">
                          <p className="kicker mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Sources
                          </p>
                          <div className="space-y-1.5">
                            {msg.sources.map((source) => (
                              <Link
                                key={source.documentId}
                                href={`/dashboard/documents/${source.documentId}`}
                                className="group flex items-center justify-between border-2 border-transparent bg-zinc-950 px-3 py-2 transition-all hover:border-[var(--color-border)] hover:bg-zinc-800"
                              >
                                <span className="truncate text-sm text-zinc-400 group-hover:text-white">
                                  {source.documentTitle}
                                </span>
                                <span className="ml-2 flex-shrink-0 font-mono text-[0.65rem] text-purple-400">
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
                  <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-red-500 bg-red-500/10">
                    <Bot className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="border-2 border-red-500 bg-red-500/5 p-4">
                    <p className="text-sm font-semibold text-red-400">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && !streamingStarted && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <NivahMascot size="sm" emotion="thinking" />
              </div>
              <div className="ai-border p-5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce bg-purple-500" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 animate-bounce bg-purple-500" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 animate-bounce bg-purple-500" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

        </div>

        <form onSubmit={handleSubmit} className="relative mt-4 flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="hidden flex-shrink-0 pb-1.5 sm:block">
              <NivahMascot size="sm" emotion={loading ? "thinking" : question ? "listening" : "idle"} inputRef={inputRef} />
            </div>
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                rows={2}
                className="brutal-input w-full resize-none px-5 py-3.5 pr-14 text-base text-white placeholder-zinc-500"
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
                className="btn-primary absolute bottom-2.5 right-2.5 p-2.5 disabled:cursor-not-allowed disabled:opacity-40"
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

        <p className="kicker mt-2 flex-shrink-0 text-center">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
