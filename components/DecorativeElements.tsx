"use client";

import { motion } from "framer-motion";

export function GradientOrb({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -30, 20, 0],
        scale: [1, 1.05, 0.95, 1],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function BrandPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute -top-40 -right-40 w-96 h-96 text-green-500/5"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="200" fill="currentColor" />
        <circle cx="200" cy="200" r="160" fill="url(#dotPattern)" />
        <defs>
          <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.3)" />
          </pattern>
        </defs>
      </svg>
      <svg
        className="absolute -bottom-40 -left-40 w-80 h-80 text-emerald-500/5"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="50" y="50" width="300" height="300" rx="60" stroke="currentColor" strokeWidth="2" />
        <rect x="100" y="100" width="200" height="200" rx="30" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}

export function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor" />
    </svg>
  );
}

export function NivahAILogo() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" className="fill-green-600" />
      <path d="M12 28V12H16L20 22L24 12H28V28H24V18.5L20.5 26H19.5L16 18.5V28H12Z" fill="white" />
    </svg>
  );
}
