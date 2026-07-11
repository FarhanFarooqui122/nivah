import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AIConnectionCard } from "@/components/DashboardComponents";
import {
  ChatGPTLogo, ClaudeLogo, GeminiLogo,
  PerplexityLogo, LlamaLogo, CopilotLogo,
  SearchIcon, BotIcon, DatabaseIcon,
} from "@/components/Icons";

export default async function AIConnectionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const aiServices = [
    { name: "ChatGPT", icon: <ChatGPTLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Connect your OpenAI account to enable ChatGPT memory sync" },
    { name: "Claude", icon: <ClaudeLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Sync conversations with Claude AI assistant" },
    { name: "Gemini", icon: <GeminiLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Connect Google's Gemini AI for cross-platform memory" },
    { name: "Perplexity", icon: <PerplexityLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Integrate Perplexity AI search and research" },
    { name: "Llama", icon: <LlamaLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Connect your local or hosted Llama models" },
    { name: "Copilot", icon: <CopilotLogo className="w-6 h-6" />, status: "disconnected" as const, description: "Sync with GitHub Copilot context" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Connections</h1>
        <p className="text-zinc-400 mt-1">Connect your AI tools to create a universal memory layer</p>
      </div>

      <div className="border border-zinc-800 rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-start gap-4">
          <BotIcon className="w-8 h-8 text-purple-400 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-white">What is Nivah Memory?</h2>
            <p className="text-zinc-400 mt-2 max-w-2xl">
              Nivah acts as a universal memory layer across all your AI tools. Connect ChatGPT, Claude, Gemini, and more to create a unified knowledge base that follows you everywhere. Your AI conversations, documents, and notes are synced automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiServices.map((ai) => (
          <AIConnectionCard key={ai.name} {...ai} />
        ))}
      </div>

      <div className="border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Cross-AI Memory", desc: "Unified context across all AIs", icon: <BotIcon className="w-5 h-5 text-purple-400" /> },
            { name: "Semantic Search", desc: "Search across all connected AIs", icon: <SearchIcon className="w-5 h-5 text-blue-400" /> },
            { name: "AI Workspace Sync", desc: "Sync workspaces in real-time", icon: <DatabaseIcon className="w-5 h-5 text-green-400" /> },
          ].map((item) => (
            <div key={item.name} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="mb-2">{item.icon}</div>
              <h3 className="font-medium text-white">{item.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}