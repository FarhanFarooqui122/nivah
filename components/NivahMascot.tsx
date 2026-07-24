"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import { motion } from "framer-motion";

type Emotion = "idle" | "listening" | "thinking" | "happy" | "laughing" | "celebrating";

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
  const [armWave, setArmWave] = useState(0);

  const sizes = {
    sm: { w: 64, h: 80, s: 1 },
    md: { w: 100, h: 124, s: 1.56 },
    lg: { w: 140, h: 174, s: 2.19 },
  };

  const s = sizes[size];
  const sc = s.s;

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

  useEffect(() => {
    if (emotion === "happy" || emotion === "laughing" || emotion === "celebrating") {
      const interval = setInterval(() => {
        setArmWave((prev) => (prev + 1) % 3);
      }, 300);
      return () => clearInterval(interval);
    }
    setArmWave(0);
  }, [emotion]);

  const trackMouse = useCallback((e: MouseEvent) => {
    if (!containerRef.current || focused) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const maxDist = 5 * sc;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 1) * maxDist;
    setPupilOffset({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [focused, sc]);

  const trackInput = useCallback(() => {
    if (!inputRef?.current || !containerRef.current) return;
    const inputRect = inputRef.current.getBoundingClientRect();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    const tx = inputRect.left + inputRect.width / 2;
    const ty = inputRect.top + inputRect.height / 2;
    const dx = (tx - cx) / rect.width;
    const dy = (ty - cy) / rect.height;
    const maxDist = 6 * sc;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 1) * maxDist;
    setPupilOffset({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [inputRef, sc]);

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

  const bodyY = emotion === "laughing" ? 1 : emotion === "celebrating" ? -1 : 0;
  const bodyRotate = emotion === "happy" ? 2 : emotion === "laughing" ? -2 : 0;

  const leftArmAngle = emotion === "idle" ? 30 : emotion === "listening" ? 20 : emotion === "thinking" ? 50 : emotion === "happy" ? -20 + armWave * 15 : emotion === "laughing" ? -30 + armWave * 20 : emotion === "celebrating" ? -60 + armWave * 30 : 30;
  const rightArmAngle = emotion === "idle" ? -30 : emotion === "listening" ? -20 : emotion === "thinking" ? -40 : emotion === "happy" ? 20 - armWave * 15 : emotion === "laughing" ? 30 - armWave * 20 : emotion === "celebrating" ? 60 - armWave * 30 : -30;

  const leftLegAngle = emotion === "idle" ? -15 : emotion === "laughing" ? 10 : emotion === "celebrating" ? 20 : -15;
  const rightLegAngle = emotion === "idle" ? 15 : emotion === "laughing" ? -10 : emotion === "celebrating" ? -20 : 15;
  const legBounce = emotion === "laughing" || emotion === "celebrating" ? 3 : 0;

  return (
    <motion.div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none ${className || ""}`}
      animate={
        emotion === "idle" ? { y: [0, -2, 0] } :
        emotion === "laughing" ? { y: [0, -2, 0] } :
        emotion === "celebrating" ? { y: [0, -4, 0, -2, 0] } :
        { y: 0 }
      }
      transition={
        emotion === "idle" ? { duration: 3, repeat: Infinity, ease: "easeInOut" } :
        emotion === "laughing" ? { duration: 0.3, repeat: Infinity } :
        emotion === "celebrating" ? { duration: 0.5, repeat: Infinity } :
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
          <radialGradient id="bodyGlow" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bodyFill" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2d2d3f" />
            <stop offset="100%" stopColor="#1a1a2e" />
          </radialGradient>
        </defs>

        {/* Thinking sparkles */}
        {emotion === "thinking" && (
          <>
            <circle cx={s.w * 0.82} cy={s.h * 0.18} r={2.5 * sc} fill="#22c55e" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values={`${s.h * 0.18};${s.h * 0.12};${s.h * 0.18}`} dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={s.w * 0.9} cy={s.h * 0.1} r={1.8 * sc} fill="#22c55e" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="cy" values={`${s.h * 0.1};${s.h * 0.04};${s.h * 0.1}`} dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx={s.w * 0.95} cy={s.h * 0.05} r={1.2 * sc} fill="#22c55e" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
            </circle>
          </>
        )}

        {/* Celebrating stars */}
        {emotion === "celebrating" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.g key={i} animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}>
                <text x={s.w * (0.7 + i * 0.12)} y={s.h * (0.1 + i * 0.06)} fontSize={8 * sc} fill="#22c55e">✦</text>
              </motion.g>
            ))}
          </>
        )}

        {/* Left leg */}
        <g transform={`translate(${s.w * 0.35}, ${s.h * 0.72}) rotate(${leftLegAngle + (emotion === "celebrating" ? Math.sin(Date.now() / 200) * 10 : 0)})`}>
          <rect x={-4 * sc} y={0} width={8 * sc} height={14 * sc} rx={4 * sc} fill="#1a1a2e" stroke="#22c55e" strokeWidth={1.2 * sc} opacity={0.8} />
          <ellipse cx={0} cy={16 * sc + legBounce * sc} rx={5 * sc} ry={3 * sc} fill="#22c55e" opacity={0.6} />
        </g>

        {/* Right leg */}
        <g transform={`translate(${s.w * 0.65}, ${s.h * 0.72}) rotate(${rightLegAngle + (emotion === "celebrating" ? Math.sin(Date.now() / 200 + 1) * 10 : 0)})`}>
          <rect x={-4 * sc} y={0} width={8 * sc} height={14 * sc} rx={4 * sc} fill="#1a1a2e" stroke="#22c55e" strokeWidth={1.2 * sc} opacity={0.8} />
          <ellipse cx={0} cy={16 * sc + legBounce * sc} rx={5 * sc} ry={3 * sc} fill="#22c55e" opacity={0.6} />
        </g>

        {/* Left arm */}
        <g transform={`translate(${s.w * 0.12}, ${s.h * 0.42}) rotate(${leftArmAngle + (emotion === "listening" ? Math.sin(Date.now() / 300) * 3 : 0)})`}>
          <rect x={-3 * sc} y={0} width={6 * sc} height={16 * sc} rx={3 * sc} fill="#1a1a2e" stroke="#22c55e" strokeWidth={1 * sc} opacity={0.8} />
          <circle cx={0} cy={18 * sc} r={3.5 * sc} fill="#22c55e" opacity={0.5} />
        </g>

        {/* Right arm */}
        <g transform={`translate(${s.w * 0.88}, ${s.h * 0.42}) rotate(${rightArmAngle + (emotion === "listening" ? Math.sin(Date.now() / 300 + 1) * 3 : 0)})`}>
          <rect x={-3 * sc} y={0} width={6 * sc} height={16 * sc} rx={3 * sc} fill="#1a1a2e" stroke="#22c55e" strokeWidth={1 * sc} opacity={0.8} />
          <circle cx={0} cy={18 * sc} r={3.5 * sc} fill="#22c55e" opacity={0.5} />
        </g>

        {/* Body glow */}
        <rect x={s.w * 0.12} y={s.h * 0.25} width={s.w * 0.76} height={s.h * 0.48} rx={s.w * 0.35} ry={s.h * 0.25} fill="url(#bodyGlow)" />

        {/* Body */}
        <rect x={s.w * 0.12} y={s.h * 0.25} width={s.w * 0.76} height={s.h * 0.48} rx={s.w * 0.35} ry={s.h * 0.25} fill="url(#bodyFill)" />

        {/* Body glow overlay */}
        <motion.rect
          x={s.w * 0.12} y={s.h * 0.25} width={s.w * 0.76} height={s.h * 0.48} rx={s.w * 0.35} ry={s.h * 0.25}
          fill="url(#bodyGlow)"
          animate={emotion === "thinking" ? { opacity: [0.3, 0.8, 0.3] } : { opacity: 0.5 }}
          transition={emotion === "thinking" ? { duration: 1.5, repeat: Infinity } : {}}
        />

        {/* Antenna */}
        <g>
          <line x1={s.w * 0.5} y1={s.h * 0.25} x2={s.w * 0.5} y2={s.h * 0.08} stroke="#22c55e" strokeWidth={1.5 * sc} strokeLinecap="round" opacity={0.6}>
            {emotion === "happy" && <animateTransform attributeName="transform" type="rotate" values="0 50 20;-8 50 20;8 50 20;0 50 20" dur="0.6s" repeatCount="indefinite" />}
            {emotion === "celebrating" && <animateTransform attributeName="transform" type="rotate" values="0 50 20;-15 50 20;15 50 20;0 50 20" dur="0.4s" repeatCount="indefinite" />}
          </line>
          <circle cx={s.w * 0.5} cy={s.h * 0.06} r={4 * sc} fill="#22c55e" opacity={0.85}>
            {emotion === "thinking" && (
              <animate attributeName="opacity" values="0.85;0.3;0.85" dur="0.5s" repeatCount="indefinite" />
            )}
            {emotion === "celebrating" && (
              <animate attributeName="r" values="4;5;4" dur="0.3s" repeatCount="indefinite" />
            )}
          </circle>
          <circle cx={s.w * 0.5} cy={s.h * 0.06} r={6 * sc} fill="none" stroke="#22c55e" strokeWidth={0.8 * sc} opacity={0.25} />
        </g>

        {/* Eyes */}
        {emotion === "happy" || emotion === "laughing" || emotion === "celebrating" ? (
          <>
            <path d={`M${s.w * 0.27} ${s.h * 0.46} Q${s.w * 0.34} ${s.h * 0.39} ${s.w * 0.41} ${s.h * 0.46}`} fill="none" stroke="white" strokeWidth={2 * sc} strokeLinecap="round" />
            <path d={`M${s.w * 0.59} ${s.h * 0.46} Q${s.w * 0.66} ${s.h * 0.39} ${s.w * 0.73} ${s.h * 0.46}`} fill="none" stroke="white" strokeWidth={2 * sc} strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={s.w * 0.34} cy={s.h * 0.46} rx={7.5 * sc} ry={8.5 * sc} fill="white" />
            <ellipse cx={s.w * 0.66} cy={s.h * 0.46} rx={7.5 * sc} ry={8.5 * sc} fill="white" />
            <circle cx={s.w * 0.34 + pupilOffset.x * 0.6} cy={s.h * 0.46 + pupilOffset.y * 0.6} r={4.5 * sc} fill="#09090b" />
            <circle cx={s.w * 0.66 + pupilOffset.x * 0.6} cy={s.h * 0.46 + pupilOffset.y * 0.6} r={4.5 * sc} fill="#09090b" />
            <circle cx={s.w * 0.34 + pupilOffset.x * 0.6 + 1.5 * sc} cy={s.h * 0.46 + pupilOffset.y * 0.6 - 1.5 * sc} r={1.5 * sc} fill="white" />
            <circle cx={s.w * 0.66 + pupilOffset.x * 0.6 + 1.5 * sc} cy={s.h * 0.46 + pupilOffset.y * 0.6 - 1.5 * sc} r={1.5 * sc} fill="white" />
          </>
        )}

        {/* Cheeks */}
        {(emotion === "idle" || emotion === "listening" || emotion === "thinking") && (
          <>
            <ellipse cx={s.w * 0.22} cy={s.h * 0.56} rx={6 * sc} ry={3.5 * sc} fill="#22c55e" opacity={0.1} />
            <ellipse cx={s.w * 0.78} cy={s.h * 0.56} rx={6 * sc} ry={3.5 * sc} fill="#22c55e" opacity={0.1} />
          </>
        )}
        {(emotion === "happy" || emotion === "laughing" || emotion === "celebrating") && (
          <>
            <ellipse cx={s.w * 0.22} cy={s.h * 0.56} rx={7 * sc} ry={4.5 * sc} fill="#22c55e" opacity={0.18} />
            <ellipse cx={s.w * 0.78} cy={s.h * 0.56} rx={7 * sc} ry={4.5 * sc} fill="#22c55e" opacity={0.18} />
          </>
        )}

        {/* Mouth */}
        {emotion === "idle" && (
          <path d={`M${s.w * 0.38} ${s.h * 0.6} Q${s.w / 2} ${s.h * 0.64} ${s.w * 0.62} ${s.h * 0.6}`} fill="none" stroke="#22c55e" strokeWidth={1.8 * sc} strokeLinecap="round" />
        )}
        {emotion === "listening" && (
          <path d={`M${s.w * 0.38} ${s.h * 0.6} Q${s.w / 2} ${s.h * 0.57} ${s.w * 0.62} ${s.h * 0.6}`} fill="none" stroke="#22c55e" strokeWidth={1.8 * sc} strokeLinecap="round" />
        )}
        {emotion === "thinking" && (
          <circle cx={s.w / 2} cy={s.h * 0.62} r={2.5 * sc} fill="#22c55e" />
        )}
        {emotion === "happy" && (
          <path d={`M${s.w * 0.33} ${s.h * 0.6} Q${s.w / 2} ${s.h * 0.7} ${s.w * 0.67} ${s.h * 0.6}`} fill="none" stroke="#22c55e" strokeWidth={2 * sc} strokeLinecap="round" />
        )}
        {emotion === "laughing" && (
          <ellipse cx={s.w / 2} cy={s.h * 0.62} rx={12 * sc} ry={6 * sc} fill="#22c55e" opacity={0.8} />
        )}
        {emotion === "celebrating" && (
          <path d={`M${s.w * 0.33} ${s.h * 0.6} Q${s.w / 2} ${s.h * 0.7} ${s.w * 0.67} ${s.h * 0.6}`} fill="none" stroke="#22c55e" strokeWidth={2.2 * sc} strokeLinecap="round" />
        )}

        {/* Blush overlay for happy/laughing/celebrating */}
        {(emotion === "happy" || emotion === "laughing" || emotion === "celebrating") && (
          <ellipse cx={s.w / 2} cy={s.h * 0.64} rx={20 * sc} ry={8 * sc} fill="#22c55e" opacity={0.05} />
        )}
      </svg>

      {/* Typing dots */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-500"
              style={{
                animation: `fadeIn 0.6s ease infinite ${i * 0.2}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
