"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import confetti from "canvas-confetti";
import { soundService } from "../utils/sound";
import { useBallAnimator } from "../hooks/useBallAnimator";
import { useBallEffectsCanvas } from "../components/BallEffectsCanvas";
import BallOverlay from "../components/BallOverlay";
import {
  ROWS,
  PEG_RADIUS,
  COL_SPACING,
  START_Y,
  getDropStartX,
  generatePegs,
  generateBins,
  PAYOUTS,
} from "../utils/plinkoCoords";

// ─── Bin color config ────────────────────────────────────────────────────────
function getBinStyle(idx, total) {
  const mid = Math.floor(total / 2);
  const dist = Math.abs(idx - mid);
  const norm = dist / mid;

  if (norm >= 0.95)
    return {
      border: "#f59e0b",
      text: "#fbbf24",
      glow: "rgba(245,158,11,0.55)",
    };
  if (norm >= 0.75)
    return {
      border: "#8b5cf6",
      text: "#a78bfa",
      glow: "rgba(139,92,246,0.45)",
    };
  if (norm >= 0.5)
    return {
      border: "#6366f1",
      text: "#818cf8",
      glow: "rgba(99,102,241,0.35)",
    };
  if (norm >= 0.25)
    return { border: "#22d3ee", text: "#67e8f9", glow: "rgba(34,211,238,0.3)" };
  return { border: "rgba(148,163,184,0.25)", text: "#94a3b8", glow: "none" };
}

// ─── Peg Node ────────────────────────────────────────────────────────────────
function PegNode({ peg, isActive, isHovered, onHover }) {
  return (
    <g onMouseEnter={() => onHover(peg.id)} onMouseLeave={() => onHover(null)}>
      {/* Ambient glow ring */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS + 5}
        fill="url(#pegAmbient)"
        opacity={isActive ? 0.9 : isHovered ? 0.35 : 0.08}
        style={{ transition: "opacity 0.12s" }}
      />
      {/* Chrome peg body */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS}
        fill="url(#pegChrome)"
        stroke={isActive ? "rgba(180,200,255,0.9)" : "rgba(255,255,255,0.18)"}
        strokeWidth={isActive ? 1 : 0.6}
        filter="url(#pegShadow)"
        style={{
          transform: isActive ? "scale(1.3)" : "scale(1)",
          transformOrigin: `${peg.x}px ${peg.y}px`,
          transition: "transform 0.08s ease-out, stroke 0.1s",
        }}
      />
      {/* Flash on impact */}
      {isActive && (
        <circle
          cx={peg.x}
          cy={peg.y}
          r={PEG_RADIUS}
          fill="rgba(255,255,255,0.7)"
          style={{ animation: "pegFlash 0.12s ease-out forwards" }}
        />
      )}
      {/* Specular highlight */}
      <circle
        cx={peg.x - 1.4}
        cy={peg.y - 1.6}
        r={PEG_RADIUS * 0.28}
        fill="rgba(255,255,255,0.82)"
      />
    </g>
  );
}

// ─── Bin Node ────────────────────────────────────────────────────────────────
function BinNode({ bin, idx, total, isActive, shouldReduceMotion }) {
  const [hovered, setHovered] = useState(false);
  const style = getBinStyle(idx, total);
  const bw = COL_SPACING - 4;

  return (
    <g
      transform={`translate(${bin.x}, ${bin.y})`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Active glow behind bin */}
      {isActive && (
        <rect
          x={-2}
          y={-2}
          width={bw + 4}
          height={54}
          rx={10}
          fill={style.glow !== "none" ? style.glow : "rgba(34,211,238,0.2)"}
          style={{
            filter: "blur(8px)",
            animation: "binGlowPulse 0.5s ease-out",
          }}
        />
      )}
      {/* Bin body */}
      <rect
        width={bw}
        height={48}
        rx={8}
        fill={`url(#binGrad${idx})`}
        stroke={
          isActive
            ? style.border
            : hovered
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.07)"
        }
        strokeWidth={isActive ? 1.5 : 0.8}
        style={{
          transform: isActive
            ? "scaleY(1.05)"
            : hovered
              ? "scaleY(1.02)"
              : "scaleY(1)",
          transformOrigin: `${bw / 2}px 24px`,
          transition: "transform 0.2s ease, stroke 0.15s",
          filter: isActive
            ? `drop-shadow(0 0 10px ${style.glow !== "none" ? style.glow : "rgba(34,211,238,0.5)"})`
            : "none",
        }}
      />
      {/* Multiplier label */}
      <text
        x={bw / 2}
        y={30}
        textAnchor="middle"
        fill={isActive ? "#ffffff" : style.text}
        fontSize={idx === 0 || idx === total ? "13" : "11"}
        fontWeight="700"
        fontFamily="'Inter', sans-serif"
        style={{ pointerEvents: "none", transition: "fill 0.15s" }}
      >
        {bin.multiplier}x
      </text>
    </g>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────
export default function PlinkoBoard({
  outcome,
  onAnimationComplete,
  isDropping,
  isTilt,
  isDebug,
  isGolden = false,
  isDungeon = false,
  compact = false,
  onLanding,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeBin, setActiveBin] = useState(null);
  const [activePeg, setActivePeg] = useState(null);
  const [hoveredPeg, setHoveredPeg] = useState(null);
  const [showPayout, setShowPayout] = useState(false);

  const containerRef = useRef(null);
  const ballRef = useRef(null);
  const canvasRef = useRef(null);
  const animatingRef = useRef(false); // ✅ single animation guard
  const pegTimeoutRef = useRef(null);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);

  const pegs = generatePegs();
  const bins = generateBins();
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  // ── Peg flash ──────────────────────────────────────────────────────────────
  const handleImpact = useCallback(
    (ev) => {
      apiRef.current.addSparks(ev.x, ev.y);
      if (pegTimeoutRef.current) clearTimeout(pegTimeoutRef.current);
      setActivePeg(ev.pegId);
      pegTimeoutRef.current = setTimeout(() => setActivePeg(null), 110);
    },
    [apiRef],
  );

  // ── Per-frame ball position update ─────────────────────────────────────────
  const handleFrame = useCallback(
    (sample, _elapsed, frameCount) => {
      ballRef.current?.update({
        x: sample.x,
        y: sample.y,
        sx: sample.sx,
        sy: sample.sy,
        rot: sample.rot,
        velocity: sample.velocity,
        visible: true,
      });
      if (frameCount % 2 === 0) {
        apiRef.current.addTrailPoint(
          sample.x,
          sample.y,
          sample.velocity,
          isGolden,
        );
      }
      apiRef.current.draw();
    },
    [apiRef, isGolden],
  );

  // ── Camera shake ───────────────────────────────────────────────────────────
  const triggerCameraShake = useCallback(
    (intensity) => {
      if (shouldReduceMotion || intensity < 3) return;
      const shakes = [0, -intensity, intensity * 0.6, -intensity * 0.3, 0];
      let i = 0;
      const run = () => {
        if (i >= shakes.length) {
          shakeX.set(0);
          shakeY.set(0);
          return;
        }
        shakeX.set(shakes[i]);
        shakeY.set(shakes[i] * 0.4);
        i++;
        setTimeout(run, 40);
      };
      run();
    },
    [shouldReduceMotion, shakeX, shakeY],
  );

  // ── Animation complete ─────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    if (!outcome) return;

    // ✅ Reset animation guard FIRST so parent can allow next drop
    animatingRef.current = false;

    const multiplier = outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex];
    setActiveBin(outcome.binIndex);
    setShowPayout(true);
    soundService.playWin(multiplier);
    triggerCameraShake(multiplier);
    onLanding?.({ binIndex: outcome.binIndex, multiplier });

    if (!shouldReduceMotion) {
      const binX = bins[outcome.binIndex];
      const originX = (binX.centerX + 300) / 600;
      const isBigWin = multiplier >= 5;
      confetti({
        particleCount: isBigWin ? 70 : 35,
        spread: isBigWin ? 70 : 50,
        origin: { x: originX, y: 0.78 },
        colors: isBigWin
          ? ["#fbbf24", "#f59e0b", "#8b5cf6", "#22d3ee"]
          : ["#8b5cf6", "#22d3ee", "#a78bfa"],
        ticks: 90,
        gravity: 1.1,
        scalar: 0.82,
      });
    }

    setTimeout(() => onAnimationComplete?.(), shouldReduceMotion ? 200 : 650);
  }, [
    outcome,
    bins,
    onLanding,
    shouldReduceMotion,
    triggerCameraShake,
    onAnimationComplete,
  ]);

  const { start, reset, cancel } = useBallAnimator({
    reducedMotion: shouldReduceMotion,
    onFrame: handleFrame,
    onImpact: handleImpact,
    onComplete: handleComplete,
  });

  // ── Attach canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) attachCanvas(canvasRef.current, "-300 0 600 680");
    return () => apiRef.current.detach?.();
  }, [attachCanvas, apiRef]);

  // ── ✅ FIXED: Only trigger on outcome change, not on isDropping or start/reset
  // This is the core fix — effect fires exactly once per new outcome object.
  useEffect(() => {
    if (!outcome?.path) return; // no outcome yet
    if (!isDropping) return; // drop was cancelled or already done
    if (animatingRef.current) return; // already animating — hard block

    animatingRef.current = true;
    setActiveBin(null);
    setShowPayout(false);
    apiRef.current.clear();

    const startX = getDropStartX(outcome.dropColumn);
    reset(startX, START_Y);
    ballRef.current?.update({
      x: startX,
      y: START_Y,
      sx: 1,
      sy: 1,
      rot: 0,
      visible: true,
    });
    start(outcome.path, outcome.dropColumn, outcome.binIndex);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]); // ✅ ONLY outcome — not start/reset/apiRef/isDropping

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(
    () => () => {
      cancel();
      if (pegTimeoutRef.current) clearTimeout(pegTimeoutRef.current);
    },
    [cancel],
  );

  const boardClass = compact
    ? "relative w-full h-[360px] sm:h-[400px]"
    : "relative w-full h-[360px] sm:h-[460px] md:h-[600px] lg:h-[680px]";

  return (
    <motion.div
      className={`${boardClass} flex items-center justify-center`}
      style={{ x: shakeX, y: shakeY, willChange: "transform" }}
      animate={{ rotate: isTilt ? [0, 2.5, -2.5, 0] : 0 }}
      transition={
        isTilt
          ? { rotate: { repeat: Infinity, duration: 3.2, ease: "easeInOut" } }
          : {}
      }
    >
      {/* Keyframes */}
      <style>{`
        @keyframes pegFlash    { from { opacity: 0.7; } to { opacity: 0; } }
        @keyframes binGlowPulse { 0% { opacity: 0.9; } 100% { opacity: 0.3; } }
      `}</style>

      <div ref={containerRef} className="relative w-full h-full">
        {/* Board depth background */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_10%,rgba(139,92,246,0.13),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_90%,rgba(34,211,238,0.07),transparent_60%)]" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.025]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="boardGrid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#boardGrid)" />
          </svg>
        </div>

        <svg
          viewBox="-300 0 600 680"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Peg drop shadow */}
            <filter id="pegShadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodColor="#000"
                floodOpacity="0.6"
              />
            </filter>

            {/* Chrome metallic peg gradient */}
            <radialGradient id="pegChrome" cx="32%" cy="28%" r="55%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#e8edf5" />
              <stop offset="55%" stopColor="#8899bb" />
              <stop offset="80%" stopColor="#445577" />
              <stop offset="100%" stopColor="#1a2035" />
            </radialGradient>

            {/* Peg ambient glow */}
            <radialGradient id="pegAmbient">
              <stop offset="0%" stopColor="rgba(100,160,255,0.8)" />
              <stop offset="100%" stopColor="rgba(100,160,255,0)" />
            </radialGradient>

            {/* Per-bin gradients */}
            {bins.map((_, idx) => {
              const total = bins.length - 1;
              const mid = Math.floor(total / 2);
              const norm = Math.abs(idx - mid) / mid;
              const top =
                norm >= 0.95
                  ? "rgba(245,158,11,0.4)"
                  : norm >= 0.75
                    ? "rgba(139,92,246,0.35)"
                    : norm >= 0.5
                      ? "rgba(99,102,241,0.28)"
                      : norm >= 0.25
                        ? "rgba(34,211,238,0.22)"
                        : "rgba(30,41,59,0.4)";
              return (
                <linearGradient
                  key={idx}
                  id={`binGrad${idx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={top} />
                  <stop offset="100%" stopColor="rgba(10,12,28,0.85)" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Drop column indicator */}
          {outcome && (
            <>
              <line
                x1={getDropStartX(outcome.dropColumn)}
                y1={0}
                x2={getDropStartX(outcome.dropColumn)}
                y2={START_Y - 2}
                stroke="rgba(34,211,238,0.35)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getDropStartX(outcome.dropColumn)}
                cy={-6}
                r={3}
                fill="rgba(34,211,238,0.5)"
              />
            </>
          )}

          {/* Bins */}
          {bins.map((bin, idx) => (
            <BinNode
              key={bin.id}
              bin={bin}
              idx={idx}
              total={bins.length - 1}
              isActive={activeBin === idx}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}

          {/* Pegs */}
          {pegs.map((peg) => (
            <g key={peg.id}>
              <PegNode
                peg={peg}
                isActive={activePeg === peg.id}
                isHovered={hoveredPeg === peg.id}
                onHover={setHoveredPeg}
              />
              {isDebug && (
                <text
                  x={peg.x}
                  y={peg.y - 9}
                  fontSize="5"
                  fill="#22d3ee"
                  textAnchor="middle"
                  opacity={0.65}
                  fontFamily="monospace"
                >
                  {peg.row},{peg.col}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Effects canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ willChange: "contents" }}
        />

        {/* Ball DOM overlay */}
        <BallOverlay
          ref={ballRef}
          isGolden={isGolden}
          containerRef={containerRef}
        />
      </div>

      {/* Payout toast */}
      <AnimatePresence>
        {showPayout && outcome && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-30"
          >
            <div className="px-6 py-3 rounded-2xl text-center backdrop-blur-md border border-white/10 bg-black/50">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 font-medium">
                Payout
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent leading-tight">
                {(
                  outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex]
                ).toFixed(1)}
                x
              </div>
              {outcome.betCents && (
                <div className="text-sm text-emerald-400 font-mono mt-0.5">
                  +$
                  {(
                    (outcome.betCents / 100) *
                    (outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex])
                  ).toFixed(2)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug overlay */}
      {isDebug && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-mono text-cyan-400 z-30 backdrop-blur-sm border border-cyan-500/20 bg-black/40">
          DEBUG: GRID ACTIVE
        </div>
      )}
    </motion.div>
  );
}
