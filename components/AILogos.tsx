export function ChatGPTLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="ChatGPT">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" className="fill-green-500" />
      <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" className="fill-white" />
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" className="fill-green-500" />
    </svg>
  );
}

export function ClaudeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Claude">
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-orange-500" />
      <text x="12" y="16" textAnchor="middle" className="fill-white font-bold text-xs" fontSize="12">C</text>
    </svg>
  );
}

export function GeminiLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Gemini">
      <circle cx="12" cy="12" r="10" className="fill-blue-500" />
      <path d="M12 6l1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5L12 6z" className="fill-white" />
    </svg>
  );
}

export function PerplexityLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Perplexity">
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-zinc-800" />
      <circle cx="12" cy="12" r="7" className="fill-blue-400" />
      <path d="M12 8l2 3 3 1-3 1-2 3-2-3-3-1 3-1 2-3z" className="fill-white" />
    </svg>
  );
}

export function LlamaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Llama">
      <circle cx="12" cy="12" r="10" className="fill-purple-500" />
      <text x="12" y="16" textAnchor="middle" className="fill-white font-bold text-xs" fontSize="12">L</text>
    </svg>
  );
}

export function CopilotLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Copilot">
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-zinc-800" />
      <path d="M12 4l8 8-8 8-8-8 8-8z" className="fill-purple-400" />
      <path d="M12 7l5 5-5 5-5-5 5-5z" className="fill-white" />
    </svg>
  );
}

export function NivahLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Nivah">
      <defs>
        <linearGradient id="nivahGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="stop-color-green-500" stopColor="#22c55e" />
          <stop offset="100%" className="stop-color-emerald-600" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#nivahGrad)" />
      <path d="M7 17V7l5 7 5-7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function FolderIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

export function FileIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function TrashIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export function DownloadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function SearchIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}