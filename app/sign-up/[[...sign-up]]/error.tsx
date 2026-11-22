"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SignUpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center border-2 border-[var(--color-border)] bg-zinc-900 p-8 shadow-[8px_8px_0_0_var(--color-primary-vivid)]">
        <div className="w-14 h-14 border-2 border-[var(--color-border)] bg-red-500/15 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="kicker mb-2">System notice</p>
        <h2 className="headline text-3xl text-white mb-2">Sign-up error</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          We couldn&apos;t complete sign-up. Please try again.
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 btn-primary transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 btn-ghost transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
