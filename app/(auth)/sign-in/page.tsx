"use client";

import { SignIn } from "@clerk/nextjs";
import { NivahLogo } from "@/components/Icons";

export default function CustomSignIn() {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600/10 via-zinc-950 to-emerald-600/10 p-12 flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-md text-center">
          <NivahLogo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Welcome back to Nivah</h1>
          <p className="text-zinc-400 text-lg">
            Your AI-powered knowledge base and document intelligence platform.
            Organize, search, and chat with your documents.
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: "🔍", text: "Semantic search across all your documents" },
              { icon: "🤖", text: "Ask questions and get grounded AI answers" },
              { icon: "📁", text: "Organize with workspaces and projects" },
              { icon: "📚", text: "Generate summaries, flashcards & quizzes" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <NivahLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-zinc-400 mt-2">Sign in to continue to Nivah</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <SignIn
              routing="path"
              path="/sign-in"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-medium transition-colors w-full",
                  card: "bg-transparent shadow-none border-none",
                  headerTitle: "text-2xl font-bold text-white",
                  headerSubtitle: "text-zinc-400",
                  dividerText: "text-zinc-500",
                  formFieldLabel: "text-zinc-300 font-medium",
                  formFieldInput: "bg-zinc-800 border-zinc-700 focus:border-green-500 focus:ring-green-500/20 rounded-xl",
                  formFieldAction: "text-green-400 hover:text-green-300",
                  socialButtonsBlockButton: "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 rounded-xl",
                  alternativeMethods: "space-y-3",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}