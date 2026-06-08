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

// ─── Bin color theme ──────────────────────────────────────────────────────────
function getBinTheme(idx, total) {
  const mid = Math.floor(total / 2);
  const dist = Math.abs(idx - mid);
  const norm = dist / mid;

  if (norm >= 0.95)
    return {
      grad0: "rgba(251,191,36,0.55)",
      grad1: "rgba(217,119,6,0.18)",
      stroke: "#f59e0b",
      glow: "#f59e0b",
      text: "#fde68a",
      glowOpacity: 0.7,
    };
  if (norm >= 0.72)
    return {
      grad0: "rgba(167,139,250,0.45)",
      grad1: "rgba(109,40,217,0.15)",
      stroke: "#8b5cf6",
      glow: "#8b5cf6",
      text: "#c4b5fd",
      glowOpacity: 0.55,
    };
  if (norm >= 0.45)
    return {
      grad0: "rgba(99,102,241,0.38)",
      grad1: "rgba(67,56,202,0.12)",
      stroke: "#6366f1",
      glow: "#818cf8",
      text: "#a5b4fc",
      glowOpacity: 0.45,
    };
  if (norm >= 0.22)
    return {
      grad0: "rgba(34,211,238,0.32)",
      grad1: "rgba(6,182,212,0.10)",
      stroke: "#22d3ee",
      glow: "#22d3ee",
      text: "#67e8f9",
      glowOpacity: 0.4,
    };
  return {
    grad0: "rgba(51,65,85,0.55)",
    grad1: "rgba(15,23,42,0.35)",
    stroke: "rgba(100,116,139,0.4)",
    glow: "#64748b",
    text: "#94a3b8",
    glowOpacity: 0.2,
  };
}

// ─── Peg ──────────────────────────────────────────────────────────────────────
function PegNode({ peg, isActive, isHovered, onHover }) {
  return (
    <g
      onMouseEnter={() => onHover(peg.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "default" }}
    >
      {/* Soft ambient halo */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS + 6}
        fill="url(#pegHalo)"
        opacity={isActive ? 1 : isHovered ? 0.4 : 0.1}
        style={{ transition: "opacity 0.1s" }}
      />
      {/* Chrome sphere */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS}
        fill="url(#pegChrome)"
        stroke={isActive ? "rgba(200,220,255,0.95)" : "rgba(255,255,255,0.20)"}
        strokeWidth={isActive ? 1.2 : 0.7}
        filter="url(#pegDrop)"
        style={{
          transform: isActive
            ? "scale(1.35)"
            : isHovered
              ? "scale(1.1)"
              : "scale(1)",
          transformOrigin: `${peg.x}px ${peg.y}px`,
          transition: "transform 0.07s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      {/* Impact flash */}
      {isActive && (
        <circle
          cx={peg.x}
          cy={peg.y}
          r={PEG_RADIUS + 1}
          fill="rgba(255,255,255,0.65)"
          style={{ animation: "pegFlash 0.14s ease-out forwards" }}
        />
      )}
      {/* Specular dot */}
      <circle
        cx={peg.x - 1.5}
        cy={peg.y - 1.8}
        r={PEG_RADIUS * 0.3}
        fill="rgba(255,255,255,0.88)"
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}

// ─── Bin (glass panel) ────────────────────────────────────────────────────────
function BinNode({ bin, idx, total, isActive, shouldReduceMotion }) {
  const [hov, setHov] = useState(false);
  const t = getBinTheme(idx, total);
  const bw = COL_SPACING - 4;
  const bh = 46;
  const mid = bw / 2;

  return (
    <g
      transform={`translate(${bin.x}, ${bin.y})`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Outer glow bloom */}
      <rect
        x={-4}
        y={-4}
        width={bw + 8}
        height={bh + 8}
        rx={12}
        fill={t.glow}
        opacity={
          isActive ? t.glowOpacity * 0.9 : hov ? t.glowOpacity * 0.25 : 0
        }
        style={{ filter: "blur(10px)", transition: "opacity 0.3s" }}
      />

      {/* Glass body */}
      <rect
        width={bw}
        height={bh}
        rx={8}
        fill={`url(#binBody${idx})`}
        style={{
          transform: isActive
            ? "scaleY(1.06)"
            : hov
              ? "scaleY(1.03)"
              : "scaleY(1)",
          transformOrigin: `${mid}px ${bh / 2}px`,
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      {/* Top glass shine strip */}
      <rect
        x={2}
        y={2}
        width={bw - 4}
        height={bh * 0.35}
        rx={6}
        fill="url(#binShine)"
        opacity={0.55}
        style={{ pointerEvents: "none" }}
      />

      {/* Active inner glow */}
      {isActive && (
        <rect
          x={1}
          y={1}
          width={bw - 2}
          height={bh - 2}
          rx={7}
          fill={t.glow}
          opacity={0.18}
          style={{ animation: "binPulse 0.6s ease-out forwards" }}
        />
      )}

      {/* Border */}
      <rect
        width={bw}
        height={bh}
        rx={8}
        fill="none"
        stroke={isActive ? t.stroke : hov ? t.stroke : t.stroke}
        strokeWidth={isActive ? 1.6 : hov ? 1.2 : 0.8}
        opacity={isActive ? 1 : hov ? 0.7 : 0.4}
        style={{ transition: "stroke-width 0.15s, opacity 0.15s" }}
      />

      {/* Multiplier label */}
      <text
        x={mid}
        y={bh / 2 + 5}
        textAnchor="middle"
        fill={isActive ? "#fff" : t.text}
        fontSize={idx === 0 || idx === total ? "12" : "10"}
        fontWeight="700"
        fontFamily="'Inter','SF Pro Display',sans-serif"
        letterSpacing="0.02em"
        style={{
          pointerEvents: "none",
          transition: "fill 0.15s",
          filter: isActive ? `drop-shadow(0 0 4px ${t.glow})` : "none",
        }}
      >
        {bin.multiplier}x
      </text>
    </g>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
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
  const animatingRef = useRef(false);
  const pegTimeout = useRef(null);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);

  const pegs = generatePegs();
  const bins = generateBins();
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  // ── Peg impact ──────────────────────────────────────────────────────────────
  const handleImpact = useCallback(
    (ev) => {
      apiRef.current.addSparks(ev.x, ev.y);
      if (pegTimeout.current) clearTimeout(pegTimeout.current);
      setActivePeg(ev.pegId);
      pegTimeout.current = setTimeout(() => setActivePeg(null), 120);
    },
    [apiRef],
  );

  // ── Frame update ────────────────────────────────────────────────────────────
  const handleFrame = useCallback(
    (sample, _e, fc) => {
      ballRef.current?.update({
        x: sample.x,
        y: sample.y,
        sx: sample.sx,
        sy: sample.sy,
        rot: sample.rot,
        velocity: sample.velocity,
        visible: true,
      });
      if (fc % 2 === 0) {
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

  // ── Camera shake ────────────────────────────────────────────────────────────
  const triggerShake = useCallback(
    (intensity) => {
      if (shouldReduceMotion || intensity < 3) return;
      const seq = [
        0,
        -intensity,
        intensity * 0.55,
        -intensity * 0.25,
        intensity * 0.1,
        0,
      ];
      let i = 0;
      const run = () => {
        if (i >= seq.length) {
          shakeX.set(0);
          shakeY.set(0);
          return;
        }
        shakeX.set(seq[i]);
        shakeY.set(seq[i] * 0.35);
        i++;
        setTimeout(run, 38);
      };
      run();
    },
    [shouldReduceMotion, shakeX, shakeY],
  );

  // ── Animation complete ──────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    if (!outcome) return;
    // ✅ Reset guard FIRST
    animatingRef.current = false;

    const multiplier = outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex];
    setActiveBin(outcome.binIndex);
    setShowPayout(true);
    soundService.playWin(multiplier);
    triggerShake(multiplier);
    onLanding?.({ binIndex: outcome.binIndex, multiplier });

    if (!shouldReduceMotion) {
      const bx = bins[outcome.binIndex];
      const originX = (bx.centerX + 300) / 600;
      confetti({
        particleCount: multiplier >= 5 ? 80 : 40,
        spread: multiplier >= 5 ? 75 : 52,
        origin: { x: Math.max(0.05, Math.min(0.95, originX)), y: 0.78 },
        colors:
          multiplier >= 5
            ? ["#fbbf24", "#f59e0b", "#8b5cf6", "#22d3ee", "#fff"]
            : ["#8b5cf6", "#22d3ee", "#a78bfa"],
        ticks: 95,
        gravity: 1.1,
        scalar: 0.8,
      });
    }

    setTimeout(() => onAnimationComplete?.(), shouldReduceMotion ? 200 : 680);
  }, [
    outcome,
    bins,
    onLanding,
    shouldReduceMotion,
    triggerShake,
    onAnimationComplete,
  ]);

  const { start, reset, cancel } = useBallAnimator({
    reducedMotion: shouldReduceMotion,
    onFrame: handleFrame,
    onImpact: handleImpact,
    onComplete: handleComplete,
  });

  // ── Attach canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) attachCanvas(canvasRef.current, "-300 0 600 680");
    return () => apiRef.current.detach?.();
  }, [attachCanvas, apiRef]);

  // ── ✅ FIXED: only triggers on new outcome object ───────────────────────────
  useEffect(() => {
    if (!outcome?.path) return;
    if (!isDropping) return;
    if (animatingRef.current) return;

    animatingRef.current = true;
    setActiveBin(null);
    setShowPayout(false);
    apiRef.current.clear();

    const sx = getDropStartX(outcome.dropColumn);
    reset(sx, START_Y);
    ballRef.current?.update({
      x: sx,
      y: START_Y,
      sx: 1,
      sy: 1,
      rot: 0,
      visible: true,
    });
    start(outcome.path, outcome.dropColumn, outcome.binIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(
    () => () => {
      cancel();
      if (pegTimeout.current) clearTimeout(pegTimeout.current);
    },
    [cancel],
  );

  const boardClass = compact
    ? "relative w-full h-[320px] sm:h-[380px]"
    : "relative w-full h-[340px] sm:h-[460px] md:h-[580px] lg:h-[660px]";

  return (
    <motion.div
      className={`${boardClass} flex items-center justify-center select-none`}
      style={{ x: shakeX, y: shakeY, willChange: "transform" }}
      animate={{ rotate: isTilt ? [0, 2.5, -2.5, 0] : 0 }}
      transition={
        isTilt
          ? { rotate: { repeat: Infinity, duration: 3.2, ease: "easeInOut" } }
          : {}
      }
    >
      <style>{`
        @keyframes pegFlash    { 0%{opacity:0.8;} 100%{opacity:0;} }
        @keyframes binPulse    { 0%{opacity:0.35;} 60%{opacity:0.22;} 100%{opacity:0;} }
        @keyframes trailGlow   { 0%{opacity:1;} 100%{opacity:0;} }
      `}</style>

      <div ref={containerRef} className="relative w-full h-full">
        {/* Depth background */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 8%, rgba(139,92,246,0.14) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 35% at 50% 92%, rgba(34,211,238,0.08) 0%, transparent 65%)",
            }}
          />
          {/* Fine grid */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.028 }}
          >
            <defs>
              <pattern
                id="bg-grid"
                width="44"
                height="44"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M44 0L0 0 0 44"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-grid)" />
          </svg>
        </div>

        <svg
          viewBox="-300 0 600 680"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Peg filters */}
            <filter id="pegDrop" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="2"
                floodColor="#000"
                floodOpacity="0.55"
              />
            </filter>
            <filter
              id="pegGlowF"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="3" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="over" />
            </filter>

            {/* Chrome peg */}
            <radialGradient id="pegChrome" cx="33%" cy="27%" r="56%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="18%" stopColor="#ecf0fb" />
              <stop offset="48%" stopColor="#8fa4cc" />
              <stop offset="76%" stopColor="#3d5280" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>

            {/* Peg halo */}
            <radialGradient id="pegHalo">
              <stop offset="0%" stopColor="rgba(148,172,255,0.9)" />
              <stop offset="100%" stopColor="rgba(148,172,255,0)" />
            </radialGradient>

            {/* Ball gradients */}
            <radialGradient id="ballChrome" cx="30%" cy="26%" r="56%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="14%" stopColor="#f0f4ff" />
              <stop offset="38%" stopColor="#c8d4f0" />
              <stop offset="65%" stopColor="#5a7ab0" />
              <stop offset="85%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0a1628" />
            </radialGradient>
            <radialGradient id="ballGold" cx="30%" cy="26%" r="56%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="18%" stopColor="#fef08a" />
              <stop offset="42%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#3c1a06" />
            </radialGradient>

            {/* Glass shine strip */}
            <linearGradient id="binShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Per-bin body gradients */}
            {bins.map((_, i) => {
              const total = bins.length - 1;
              const th = getBinTheme(i, total);
              return (
                <linearGradient
                  key={i}
                  id={`binBody${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={th.grad0} />
                  <stop offset="100%" stopColor={th.grad1} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Drop column indicator */}
          {!isDropping && outcome == null && (
            <>
              <line
                x1={getDropStartX(6)}
                y1={0}
                x2={getDropStartX(6)}
                y2={22}
                stroke="rgba(34,211,238,0.3)"
                strokeWidth="1.2"
                strokeDasharray="3 4"
              />
            </>
          )}
          {outcome && !animatingRef.current && (
            <circle
              cx={getDropStartX(outcome.dropColumn)}
              cy={-8}
              r={3.5}
              fill="rgba(34,211,238,0.55)"
            />
          )}

          {/* Bins */}
          {bins.map((bin, i) => (
            <BinNode
              key={bin.id}
              bin={bin}
              idx={i}
              total={bins.length - 1}
              isActive={activeBin === i}
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
                  y={peg.y - 10}
                  fontSize="5"
                  fill="#22d3ee"
                  textAnchor="middle"
                  opacity={0.6}
                  fontFamily="monospace"
                >
                  {peg.row},{peg.col}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Canvas effects layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ willChange: "contents" }}
        />

        {/* Ball overlay */}
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
            key="payout-toast"
            initial={{ opacity: 0, y: 18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-30"
          >
            <div
              className="px-7 py-3.5 rounded-2xl text-center"
              style={{
                background: "rgba(5,8,22,0.75)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-0.5 font-medium">
                Payout
              </div>
              <div
                className="text-2xl font-bold leading-tight"
                style={{
                  background:
                    "linear-gradient(135deg, #67e8f9 0%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 8px rgba(167,139,250,0.5))",
                }}
              >
                {(
                  outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex]
                ).toFixed(1)}
                x
              </div>
              {outcome.betCents && (
                <div className="text-sm text-emerald-400 font-mono mt-0.5 font-semibold">
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

      {isDebug && (
        <div
          className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-lg text-[9px] font-mono text-cyan-400"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
        >
          DEBUG · GRID ACTIVE
        </div>
      )}
    </motion.div>
  );
}
