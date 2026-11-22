"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { NivahLogo } from "@/components/Icons";
import { motion } from "framer-motion";
import { Search, MessageSquare, FolderOpen, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Semantic search",
    copy: "Find anything by meaning across every document you own.",
  },
  {
    icon: MessageSquare,
    title: "Grounded answers",
    copy: "Ask questions and get replies cited straight from your files.",
  },
  {
    icon: FolderOpen,
    title: "Workspaces",
    copy: "Organize projects, teams and research into clean silos.",
  },
  {
    icon: FileText,
    title: "Study tools",
    copy: "Generate summaries, flashcards and quizzes on demand.",
  },
];

export default function CustomSignIn() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r-2 border-[var(--color-border)] bg-zinc-900 p-10 lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <NivahLogo className="h-10 w-10" />
          <span className="font-display text-2xl uppercase tracking-tight text-white">Nivah</span>
          <span className="kicker ml-auto hidden xl:block">AI memory layer</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-xl"
        >
          <p className="kicker mb-5">Welcome back</p>
          <h1 className="headline text-5xl text-white xl:text-6xl">
            Pick up where
            <br />
            <span className="box-decoration-clone bg-primary-vivid px-2 text-white">
              your memory
            </span>
            <br />
            left off.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            Your AI-powered knowledge base and document intelligence platform. Organize, search,
            and chat with everything you have saved.
          </p>

          <ul className="mt-10 border-t-2 border-[var(--color-border)]">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.li
                  key={feature.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-4 border-b-2 border-[var(--color-border)] py-4"
                >
                  <span className="font-display text-lg leading-none text-purple-400">
                    0{i + 1}
                  </span>
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-white">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{feature.copy}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        <p className="relative z-10 max-w-sm border-l-4 border-purple-500 pl-4 text-[0.65rem] font-bold uppercase leading-relaxed tracking-[0.18em] text-zinc-500">
          AI models provide intelligence.
          <br />
          Nivah provides memory.
        </p>
      </aside>

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex w-full items-center justify-center p-5 sm:p-8 lg:w-1/2"
      >
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <NivahLogo className="h-9 w-9" />
            <span className="font-display text-2xl uppercase tracking-tight text-white">Nivah</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            className="border-2 border-[var(--color-border)] bg-zinc-900 p-6 shadow-[8px_8px_0_0_var(--color-primary-vivid)] sm:p-8"
          >
            <div className="mb-6 flex items-end justify-between border-b-2 border-[var(--color-border)] pb-3">
              <div>
                <p className="kicker">Sign in</p>
                <p className="font-display text-xl uppercase text-white">Access console</p>
              </div>
              <span className="font-display text-3xl leading-none text-purple-500">01</span>
            </div>

            <SignIn
              routing="path"
              path="/sign-in"
              appearance={{
                elements: {
                  formButtonPrimary:
                    "btn-primary w-full px-4 py-3 transition-all duration-200",
                  card: "bg-transparent shadow-none border-none",
                  headerTitle: "font-display text-2xl uppercase text-white",
                  headerSubtitle: "text-zinc-400",
                  dividerText: "text-zinc-500 text-[0.65rem] font-bold uppercase tracking-widest",
                  formFieldLabel: "text-zinc-300 text-[0.7rem] font-bold uppercase tracking-widest",
                  formFieldInput:
                    "bg-zinc-950 border-2 border-[var(--color-border)] rounded-none text-white focus:border-purple-500 focus:ring-0 transition-all duration-200",
                  formFieldAction: "text-purple-400 hover:text-purple-300 transition-colors",
                  socialButtonsBlockButton:
                    "bg-zinc-950 hover:bg-zinc-800 border-2 border-[var(--color-border)] rounded-none transition-all duration-200",
                  alternativeMethods: "space-y-3",
                },
              }}
            />
          </motion.div>

          <p className="mt-6 text-center text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500">
            New to Nivah?{" "}
            <Link
              href="/sign-up"
              className="text-purple-400 underline decoration-2 underline-offset-4 transition-colors hover:text-white"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
