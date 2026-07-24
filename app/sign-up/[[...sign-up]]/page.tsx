"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { NivahLogo } from "@/components/Icons";
import { motion } from "framer-motion";
import { GradientOrb, BrandPattern, SparkleIcon } from "@/components/DecorativeElements";

export default function CustomSignUp() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600/10 via-zinc-950 to-green-600/10 p-12 flex-col items-center justify-center relative overflow-hidden">
        <BrandPattern />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
        <GradientOrb className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <GradientOrb className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="relative inline-block">
              <NivahLogo className="w-16 h-16 mx-auto mb-6" />
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-1 -right-1"
              >
                <SparkleIcon className="w-5 h-5 text-emerald-400" />
              </motion.div>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Join <span className="gradient-text">Nivah</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-lg leading-relaxed"
          >
            Create your AI-powered knowledge base. Organize documents,
            search by meaning, and chat with your files.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 space-y-5 text-left max-w-sm mx-auto"
          >
            {[
              { icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ), text: "Semantic search across all your documents" },
              { icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1010 10 10 10 0 00-10-10z" /><path d="M12 6v6l4 2" />
                </svg>
              ), text: "Ask questions and get grounded AI answers" },
              { icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              ), text: "Organize with workspaces and projects" },
              { icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              ), text: "Generate summaries, flashcards & quizzes" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-zinc-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all">
                  {item.icon}
                </div>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
      >
        <BrandPattern />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden text-center mb-8">
            <NivahLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Create your account</h1>
            <p className="text-zinc-400 mt-2">Join Nivah and start building your knowledge base</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-glass"
          >
            <SignUp
              routing="path"
              path="/sign-up"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-medium transition-all duration-200 w-full",
                  card: "bg-transparent shadow-none border-none",
                  headerTitle: "text-2xl font-bold text-white",
                  headerSubtitle: "text-zinc-400",
                  dividerText: "text-zinc-500",
                  formFieldLabel: "text-zinc-300 font-medium",
                  formFieldInput: "bg-zinc-800 border-zinc-700 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-200",
                  formFieldAction: "text-green-400 hover:text-green-300 transition-colors",
                  socialButtonsBlockButton: "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 rounded-xl transition-all duration-200",
                  alternativeMethods: "space-y-3",
                },
              }}
            />
          </motion.div>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
