"use client";

import { useRef } from "react";
import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Copy, Check, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizItem {
  question: string;
  answer: string;
}

interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
}

interface StudyContentItem {
  id: string;
  type: string;
  content: Flashcard[] | QuizItem[] | MCQ[] | { notes: string } | { raw: string };
  createdAt: string;
}

interface StudyViewProps {
  documentId: string;
}

const TABS = [
  { key: "flashcards", label: "Flashcards" },
  { key: "quiz", label: "Quiz" },
  { key: "mcq", label: "MCQs" },
  { key: "short-notes", label: "Short Notes" },
] as const;

type StudyTab = (typeof TABS)[number]["key"];

export function StudyModeClient({ documentId }: StudyViewProps) {
  const [activeTab, setActiveTab] = useState<StudyTab>("flashcards");
  const [studyContent, setStudyContent] = useState<Record<string, StudyContentItem>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    const seq = ++loadSeqRef.current;
    fetch(`/api/study?documentId=${documentId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load study content (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (seq !== loadSeqRef.current) return;
        const map: Record<string, StudyContentItem> = {};
        for (const item of data.content || []) {
          if (!map[item.type]) map[item.type] = item;
        }
        setStudyContent(map);
        setCardIndex(0);
        setFlipped(false);
      })
      .catch((e) => {
        if (seq !== loadSeqRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load study content");
      });
  }, [documentId]);

  const generate = useCallback(async (type: StudyTab) => {
    loadSeqRef.current++;
    setLoading((prev) => ({ ...prev, [type]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudyContent((prev) => ({ ...prev, [type]: data.studyContent }));
        setCardIndex(0);
        setFlipped(false);
        setMcqAnswers({});
        setMcqSubmitted(false);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Generation failed");
    }
    setLoading((prev) => ({ ...prev, [type]: false }));
  }, [documentId]);

  const hasContent = studyContent[activeTab];

  const renderFlashcards = () => {
    const data = studyContent.flashcards;
    if (!data) return null;
    const cards = data.content as Flashcard[];
    if (!Array.isArray(cards) || cards.length === 0) return null;

    const safeIndex = Math.min(cardIndex, cards.length - 1);
    const card = cards[safeIndex];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="kicker">{safeIndex + 1} of {cards.length}</span>
          <button
            onClick={() => generate("flashcards")}
            disabled={loading.flashcards}
            className="flex items-center gap-1.5 border-2 border-[var(--color-border)] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading.flashcards ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Show question" : "Show answer"}
          onClick={() => setFlipped(!flipped)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped(!flipped);
            }
          }}
          className="group flex min-h-[250px] cursor-pointer items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900 p-8 shadow-[5px_5px_0_0_var(--color-primary-vivid)] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-primary-vivid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <div className="text-center">
            <p className="kicker mb-3">
              {flipped ? "Answer" : "Question"}
            </p>
            <p className="text-lg font-semibold leading-relaxed text-white">
              {flipped ? card.answer : card.question}
            </p>
            <p className="mt-4 text-[0.6rem] font-bold uppercase tracking-widest text-zinc-500">Click or press Enter to flip</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={safeIndex === 0}
            className="border-2 border-[var(--color-border)] bg-zinc-900 p-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setCardIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
            disabled={safeIndex >= cards.length - 1}
            className="border-2 border-[var(--color-border)] bg-zinc-900 p-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const data = studyContent.quiz;
    if (!data) return null;
    const items = data.content as QuizItem[];
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="kicker">{items.length} questions</span>
          <button
            onClick={() => generate("quiz")}
            disabled={loading.quiz}
            className="flex items-center gap-1.5 border-2 border-[var(--color-border)] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading.quiz ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="overflow-hidden border-2 border-[var(--color-border)] bg-zinc-900">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-800/50"
              >
                <span className="font-semibold text-white">
                  <span className="mr-2 font-mono text-xs text-zinc-500">Q{i + 1}.</span>
                  {item.question}
                </span>
                <ChevronRight className={cn("w-4 h-4 text-zinc-500 transition-transform", expanded === i && "rotate-90")} />
              </button>
              {expanded === i && (
                <div className="border-t-2 border-[var(--color-border)] bg-zinc-950 px-5 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-emerald-600 dark:text-emerald-400">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMCQ = () => {
    const data = studyContent.mcq;
    if (!data) return null;
    const items = data.content as MCQ[];
    if (!Array.isArray(items) || items.length === 0) return null;

    const handleAnswer = (qIndex: number, optIndex: number) => {
      if (mcqSubmitted) return;
      setMcqAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
    };

    const score = mcqSubmitted
      ? items.filter((item, i) => mcqAnswers[i] === item.correctIndex).length
      : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="kicker">{items.length} questions</span>
          <div className="flex items-center gap-2">
            {mcqSubmitted && (
              <span className="border-2 border-emerald-500 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Score: {score}/{items.length}
              </span>
            )}
            {!mcqSubmitted && Object.keys(mcqAnswers).length > 0 && (
              <button
                onClick={() => setMcqSubmitted(true)}
                className="btn-primary px-3 py-1.5 text-[0.65rem]"
              >
                Submit
              </button>
            )}
            <button
              onClick={() => { generate("mcq"); setMcqAnswers({}); setMcqSubmitted(false); }}
              disabled={loading.mcq}
              className="flex items-center gap-1.5 border-2 border-[var(--color-border)] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading.mcq ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, qIndex) => (
            <div key={qIndex} className="border-2 border-[var(--color-border)] bg-zinc-900 p-5">
              <p className="mb-3 font-semibold text-white">
                <span className="mr-2 font-mono text-xs text-zinc-500">Q{qIndex + 1}.</span>
                {item.question}
              </p>
              <div className="space-y-2">
                {item.options.map((opt, oIndex) => {
                  const selected = mcqAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === item.correctIndex;
                  let optionClass = "border-[var(--color-border)] hover:bg-zinc-800";
                  if (mcqSubmitted) {
                    if (isCorrect) optionClass = "border-emerald-500 bg-emerald-500/10";
                    else if (selected && !isCorrect) optionClass = "border-red-500 bg-red-500/10";
                    else optionClass = "border-[var(--color-border)] opacity-50";
                  } else if (selected) {
                    optionClass = "border-emerald-500 bg-emerald-500/5";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleAnswer(qIndex, oIndex)}
                      disabled={mcqSubmitted}
                      className={cn(
                        "flex w-full items-center gap-3 border-2 px-4 py-3 text-left transition-all",
                        optionClass,
                      )}
                    >
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center border-2 text-sm font-bold",
                        mcqSubmitted && isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                        mcqSubmitted && selected && !isCorrect ? "border-red-500 bg-red-500 text-white" :
                        selected ? "border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "border-[var(--color-border)] bg-zinc-800 text-zinc-400"
                      )}>
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                      <span className="text-sm text-zinc-300">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {mcqSubmitted && (
          <div className="border-2 border-emerald-500 bg-emerald-500/10 p-5 text-center">
            <p className="font-display text-2xl uppercase text-white">
              Score {score}/{items.length} <span className="text-emerald-400">({Math.round((score / items.length) * 100)}%)</span>
            </p>
            <button
              onClick={() => { setMcqAnswers({}); setMcqSubmitted(false); }}
              className="btn-ghost mt-3 px-4 py-2 text-xs"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderShortNotes = () => {
    const data = studyContent["short-notes"];
    if (!data) return null;
    const notesData = data.content as { notes?: string; raw?: string };
    const notes = notesData.notes || notesData.raw || "";

    const handleCopy = () => {
      navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="kicker">Study notes</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 border-2 border-[var(--color-border)] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => generate("short-notes")}
              disabled={loading["short-notes"]}
              className="flex items-center gap-1.5 border-2 border-[var(--color-border)] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading["short-notes"] ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>

        <div className="border-2 border-[var(--color-border)] bg-zinc-900 p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{notes}</pre>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 animate-pulse text-purple-400" />
          <p className="kicker">Generating {TABS.find((t) => t.key === activeTab)?.label?.toLowerCase()}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="border-2 border-red-500 bg-red-500/5 p-6 text-center">
          <p className="font-semibold text-red-400">{error}</p>
          <button onClick={() => generate(activeTab)} className="btn-primary mt-3 px-4 py-2 text-xs">
            Retry
          </button>
        </div>
      );
    }

    if (!hasContent) {
      return (
        <div className="border-2 border-dashed border-[var(--color-border)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-[var(--color-border)] bg-zinc-900">
            <Lightbulb className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="font-display text-xl uppercase text-white">No {TABS.find((t) => t.key === activeTab)?.label?.toLowerCase()} yet</p>
          <p className="mt-1 text-sm text-zinc-500">Generate study material from this document</p>
          <button
            onClick={() => generate(activeTab)}
            className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs"
          >
            <Sparkles className="w-4 h-4" />
            Generate {TABS.find((t) => t.key === activeTab)?.label}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "flashcards": return renderFlashcards();
      case "quiz": return renderQuiz();
      case "mcq": return renderMCQ();
      case "short-notes": return renderShortNotes();
      default: return null;
    }
  };

  if (!documentId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setFlipped(false); setMcqAnswers({}); setMcqSubmitted(false); setExpanded(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-purple-600 text-on-brand"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
