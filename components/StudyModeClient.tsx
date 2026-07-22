"use client";

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

  useEffect(() => {
    fetch(`/api/study?documentId=${documentId}`)
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, StudyContentItem> = {};
        for (const item of data.content || []) {
          if (!map[item.type]) map[item.type] = item;
        }
        setStudyContent(map);
      })
      .catch(() => {});
  }, [documentId]);

  const generate = useCallback(async (type: StudyTab) => {
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

    const card = cards[cardIndex];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{cardIndex + 1} of {cards.length}</span>
          <button
            onClick={() => generate("flashcards")}
            disabled={loading.flashcards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading.flashcards ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>

        <div
          onClick={() => setFlipped(!flipped)}
          className="cursor-pointer p-8 rounded-2xl border border-zinc-700 bg-zinc-900 min-h-[250px] flex items-center justify-center transition-all hover:border-green-500/50"
        >
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">
              {flipped ? "Answer" : "Question"}
            </p>
            <p className="text-lg text-white font-medium leading-relaxed">
              {flipped ? card.answer : card.question}
            </p>
            <p className="text-xs text-zinc-600 mt-4">Click to flip</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={cardIndex === 0}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setCardIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
            disabled={cardIndex >= cards.length - 1}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50"
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
          <span className="text-sm text-zinc-500">{items.length} questions</span>
          <button
            onClick={() => generate("quiz")}
            disabled={loading.quiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading.quiz ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/50 transition-colors"
              >
                <span className="text-white font-medium">
                  <span className="text-zinc-500 mr-2">Q{i + 1}.</span>
                  {item.question}
                </span>
                <ChevronRight className={cn("w-4 h-4 text-zinc-500 transition-transform", expanded === i && "rotate-90")} />
              </button>
              {expanded === i && (
                <div className="px-5 pb-4 pt-2 border-t border-zinc-800">
                  <p className="text-sm text-green-400 leading-relaxed">{item.answer}</p>
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
          <span className="text-sm text-zinc-500">{items.length} questions</span>
          <div className="flex items-center gap-2">
            {mcqSubmitted && (
              <span className="text-sm text-green-400">
                Score: {score}/{items.length}
              </span>
            )}
            {!mcqSubmitted && Object.keys(mcqAnswers).length > 0 && (
              <button
                onClick={() => setMcqSubmitted(true)}
                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
              >
                Submit
              </button>
            )}
            <button
              onClick={() => { generate("mcq"); setMcqAnswers({}); setMcqSubmitted(false); }}
              disabled={loading.mcq}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${loading.mcq ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, qIndex) => (
            <div key={qIndex} className="border border-zinc-800 rounded-2xl p-5">
              <p className="text-white font-medium mb-3">
                <span className="text-zinc-500 mr-2">Q{qIndex + 1}.</span>
                {item.question}
              </p>
              <div className="space-y-2">
                {item.options.map((opt, oIndex) => {
                  const selected = mcqAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === item.correctIndex;
                  let optionClass = "border-zinc-700 hover:border-zinc-500";
                  if (mcqSubmitted) {
                    if (isCorrect) optionClass = "border-green-500 bg-green-500/10";
                    else if (selected && !isCorrect) optionClass = "border-red-500 bg-red-500/10";
                    else optionClass = "border-zinc-700 opacity-50";
                  } else if (selected) {
                    optionClass = "border-green-500/50 bg-green-500/5";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleAnswer(qIndex, oIndex)}
                      disabled={mcqSubmitted}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        optionClass,
                      )}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium",
                        mcqSubmitted && isCorrect ? "bg-green-500 text-white" :
                        mcqSubmitted && selected && !isCorrect ? "bg-red-500 text-white" :
                        selected ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-400"
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
          <div className="border border-green-500/30 rounded-2xl p-5 bg-green-900/10 text-center">
            <p className="text-lg font-semibold text-white">
              Your Score: {score}/{items.length} ({Math.round((score / items.length) * 100)}%)
            </p>
            <button
              onClick={() => { setMcqAnswers({}); setMcqSubmitted(false); }}
              className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors"
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
          <span className="text-sm text-zinc-500">Study notes</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-xs"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => generate("short-notes")}
              disabled={loading["short-notes"]}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${loading["short-notes"] ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/50">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{notes}</pre>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-green-400 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-400">Generating {TABS.find((t) => t.key === activeTab)?.label?.toLowerCase()}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="border border-red-500/30 rounded-2xl p-6 text-center bg-red-500/5">
          <p className="text-red-400">{error}</p>
          <button onClick={() => generate(activeTab)} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      );
    }

    if (!hasContent) {
      return (
        <div className="border border-zinc-800 rounded-2xl p-12 text-center">
          <Lightbulb className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No {TABS.find((t) => t.key === activeTab)?.label?.toLowerCase()} yet</p>
          <p className="text-zinc-500 text-sm mt-1">Generate study material from this document</p>
          <button
            onClick={() => generate(activeTab)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
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
                ? "bg-green-600 text-white"
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
