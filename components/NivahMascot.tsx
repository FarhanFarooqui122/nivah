"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import { motion } from "framer-motion";

type Emotion = "idle" | "listening" | "thinking" | "happy" | "laughing";

interface NivahMascotProps {
  emotion?: Emotion;
  size?: "sm" | "md" | "lg";
  className?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}

export function NivahMascot({ emotion: forcedEmotion, size = "md", className, inputRef }: NivahMascotProps) {
  const [emotion, setEmotion] = useState<Emotion>(forcedEmotion || "idle");
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const sizes = {
    sm: { w: 64, h: 72, stroke: 2, eyeR: 4.5, pupilR: 2.5, cheekR: 4 },
    md: { w: 100, h: 112, stroke: 2.5, eyeR: 7, pupilR: 4, cheekR: 6 },
    lg: { w: 140, h: 158, stroke: 3, eyeR: 10, pupilR: 5.5, cheekR: 9 },
  };

  const s = sizes[size];

  useEffect(() => {
    if (forcedEmotion) {
      startTransition(() => setEmotion(forcedEmotion));
      return;
    }

    const interval = setInterval(() => {
      const emotions: Emotion[] = ["idle", "idle", "idle", "happy", "idle"];
      startTransition(() => setEmotion(emotions[Math.floor(Math.random() * emotions.length)]));
    }, 4000);
    return () => clearInterval(interval);
  }, [forcedEmotion]);

  useEffect(() => {
    if (forcedEmotion) return;
    if (isTyping) {
      startTransition(() => setEmotion("listening"));
    } else if (!isTyping && emotion === "listening") {
      startTransition(() => setEmotion("idle"));
    }
  }, [isTyping, forcedEmotion, emotion]);

  const trackMouse = useCallback((e: MouseEvent) => {
    if (!containerRef.current || focused) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const maxDist = s.pupilR * 1.2;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 1) * maxDist;
    setPupilOffset({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [focused, s.pupilR]);

  const trackInput = useCallback(() => {
    if (!inputRef?.current || !containerRef.current) return;
    const inputRect = inputRef.current.getBoundingClientRect();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    const tx = inputRect.left + inputRect.width / 2;
    const ty = inputRect.top + inputRect.height / 2;
    const dx = (tx - cx) / (rect.width);
    const dy = (ty - cy) / (rect.height);
    const maxDist = s.pupilR * 1.5;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 1) * maxDist;
    setPupilOffset({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [inputRef, s.pupilR]);

  useEffect(() => {
    if (focused && inputRef?.current) {
      const interval = setInterval(trackInput, 100);
      trackInput();
      return () => clearInterval(interval);
    }
  }, [focused, inputRef, trackInput]);

  useEffect(() => {
    if (focused) return;
    window.addEventListener("mousemove", trackMouse);
    return () => window.removeEventListener("mousemove", trackMouse);
  }, [trackMouse, focused]);

  useEffect(() => {
    if (!inputRef?.current) return;
    const el = inputRef.current;
    const onFocus = () => { setFocused(true); setIsTyping(true); };
    const onBlur = () => { setFocused(false); setIsTyping(false); };
    const onInput = () => { if (!isTyping) setIsTyping(true); };
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    el.addEventListener("input", onInput);
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("input", onInput);
    };
  }, [inputRef, isTyping]);

  const getMouth = () => {
    switch (emotion) {
      case "happy":
        return <path d={`M${s.w * 0.35} ${s.h * 0.72} Q${s.w / 2} ${s.h * 0.82} ${s.w * 0.65} ${s.h * 0.72}`} fill="none" stroke="#22c55e" strokeWidth={s.stroke} strokeLinecap="round" />;
      case "laughing":
        return <ellipse cx={s.w / 2} cy={s.h * 0.73} rx={s.w * 0.14} ry={s.h * 0.07} fill="#22c55e" />;
      case "thinking":
        return <circle cx={s.w / 2} cy={s.h * 0.73} r={s.w * 0.04} fill="#22c55e" />;
      case "listening":
        return <path d={`M${s.w * 0.38} ${s.h * 0.72} Q${s.w / 2} ${s.h * 0.68} ${s.w * 0.62} ${s.h * 0.72}`} fill="none" stroke="#22c55e" strokeWidth={s.stroke} strokeLinecap="round" />;
      default:
        return <path d={`M${s.w * 0.37} ${s.h * 0.72} Q${s.w / 2} ${s.h * 0.76} ${s.w * 0.63} ${s.h * 0.72}`} fill="none" stroke="#22c55e" strokeWidth={s.stroke} strokeLinecap="round" />;
    }
  };

  const getEyes = () => {
    if (emotion === "happy" || emotion === "laughing") {
      return (
        <>
          <path d={`M${s.w * 0.28} ${s.h * 0.55} Q${s.w * 0.35} ${s.h * 0.48} ${s.w * 0.42} ${s.h * 0.55}`} fill="none" stroke="white" strokeWidth={s.stroke} strokeLinecap="round" />
          <path d={`M${s.w * 0.58} ${s.h * 0.55} Q${s.w * 0.65} ${s.h * 0.48} ${s.w * 0.72} ${s.h * 0.55}`} fill="none" stroke="white" strokeWidth={s.stroke} strokeLinecap="round" />
        </>
      );
    }
    return (
      <>
        <ellipse cx={s.w * 0.35} cy={s.h * 0.55} rx={s.eyeR} ry={s.eyeR * 1.1} fill="white" />
        <ellipse cx={s.w * 0.65} cy={s.h * 0.55} rx={s.eyeR} ry={s.eyeR * 1.1} fill="white" />
        <circle cx={s.w * 0.35 + pupilOffset.x} cy={s.h * 0.55 + pupilOffset.y} r={s.pupilR} fill="#09090b" />
        <circle cx={s.w * 0.65 + pupilOffset.x} cy={s.h * 0.55 + pupilOffset.y} r={s.pupilR} fill="#09090b" />
        <circle cx={s.w * 0.35 + pupilOffset.x + s.pupilR * 0.3} cy={s.h * 0.55 + pupilOffset.y - s.pupilR * 0.3} r={s.pupilR * 0.35} fill="white" />
        <circle cx={s.w * 0.65 + pupilOffset.x + s.pupilR * 0.3} cy={s.h * 0.55 + pupilOffset.y - s.pupilR * 0.3} r={s.pupilR * 0.35} fill="white" />
      </>
    );
  };

  const typingDot = isTyping && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute -bottom-1 left-1/2 -translate-x-1/2"
    >
      <svg width={s.w * 0.3} height={s.h * 0.06} viewBox={`0 0 ${s.w * 0.3} ${s.h * 0.06}`}>
        <circle cx={s.w * 0.04} cy={s.h * 0.03} r={s.w * 0.018} fill="#22c55e">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx={s.w * 0.1} cy={s.h * 0.03} r={s.w * 0.018} fill="#22c55e">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle cx={s.w * 0.16} cy={s.h * 0.03} r={s.w * 0.018} fill="#22c55e">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
        </circle>
      </svg>
    </motion.div>
  );

  return (
    <motion.div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none ${className || ""}`}
      animate={
        emotion === "idle" ? { y: [0, -3, 0] } :
        emotion === "laughing" ? { y: [0, -2, 0] } :
        emotion === "listening" ? { y: 0 } :
        emotion === "thinking" ? { y: 0 } :
        { y: 0 }
      }
      transition={
        emotion === "idle" ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
        emotion === "laughing" ? { duration: 0.3, repeat: Infinity } :
        { duration: 0.3 }
      }
    >
      <svg
        width={s.w}
        height={s.h}
        viewBox={`0 0 ${s.w} ${s.h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bodyGlow" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {emotion === "thinking" && (
          <>
            <circle cx={s.w * 0.8} cy={s.h * 0.22} r={s.w * 0.03} fill="#22c55e" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={s.w * 0.88} cy={s.h * 0.15} r={s.w * 0.02} fill="#22c55e" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx={s.w * 0.93} cy={s.h * 0.08} r={s.w * 0.015} fill="#22c55e" opacity="0.2">
              <animate attributeName="opacity" values="0.2;0;0.2" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
            </circle>
          </>
        )}

        <rect x={s.w * 0.15} y={s.h * 0.3} width={s.w * 0.7} height={s.h * 0.5} rx={s.w * 0.3} ry={s.h * 0.25} fill="url(#bodyGlow)" />

        <rect x={s.w * 0.15} y={s.h * 0.3} width={s.w * 0.7} height={s.h * 0.5} rx={s.w * 0.3} ry={s.h * 0.25} fill="#1a1a2e" />

        <motion.rect
          x={s.w * 0.15} y={s.h * 0.3} width={s.w * 0.7} height={s.h * 0.5} rx={s.w * 0.3} ry={s.h * 0.25}
          fill="url(#bodyGlow)"
          animate={emotion === "thinking" ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.6 }}
          transition={emotion === "thinking" ? { duration: 1.5, repeat: Infinity } : {}}
        />

        <rect x={s.w * 0.15} y={s.h * 0.3} width={s.w * 0.7} height={s.h * 0.5} rx={s.w * 0.3} ry={s.h * 0.25} fill="url(#bodyGradient)" opacity="0.15" />

        <line x1={s.w * 0.5} y1={s.h * 0.3} x2={s.w * 0.5} y2={s.h * 0.12} stroke="#22c55e" strokeWidth={s.stroke * 0.7} strokeLinecap="round" opacity="0.6">
          {emotion === "happy" && <animateTransform attributeName="transform" type="rotate" values="0 50 25;-10 50 25;10 50 25;0 50 25" dur="0.6s" repeatCount="indefinite" />}
        </line>

        <circle cx={s.w * 0.5} cy={s.h * 0.09} r={s.w * 0.045} fill="#22c55e" opacity="0.8">
          {emotion === "thinking" && (
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.5s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx={s.w * 0.5} cy={s.h * 0.09} r={s.w * 0.065} fill="none" stroke="#22c55e" strokeWidth={s.stroke * 0.5} opacity="0.3" />

        {getEyes()}

        {(emotion === "idle" || emotion === "listening" || emotion === "thinking") && (
          <>
            <ellipse cx={s.w * 0.25} cy={s.h * 0.63} rx={s.cheekR} ry={s.cheekR * 0.6} fill="#22c55e" opacity="0.12" />
            <ellipse cx={s.w * 0.75} cy={s.h * 0.63} rx={s.cheekR} ry={s.cheekR * 0.6} fill="#22c55e" opacity="0.12" />
          </>
        )}

        {(emotion === "happy" || emotion === "laughing") && (
          <>
            <ellipse cx={s.w * 0.25} cy={s.h * 0.63} rx={s.cheekR * 1.2} ry={s.cheekR * 0.8} fill="#22c55e" opacity="0.2" />
            <ellipse cx={s.w * 0.75} cy={s.h * 0.63} rx={s.cheekR * 1.2} ry={s.cheekR * 0.8} fill="#22c55e" opacity="0.2" />
          </>
        )}

        {getMouth()}
      </svg>

      {typingDot}
    </motion.div>
  );
}
