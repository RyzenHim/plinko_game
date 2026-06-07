"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useReducedMotion, AnimatePresence } from "framer-motion";
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

function PegNode({ peg, isActive, isHovered, onHover }) {
  return (
    <g
      onMouseEnter={() => onHover(peg.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "default" }}
    >
      {/* Tiny Glow Pulse (behind peg) */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS + 4}
        fill="url(#pegGlow)"
        className={isActive ? "peg-glow-active" : ""}
        style={{
          transformOrigin: `${peg.x}px ${peg.y}px`,
          opacity: isHovered ? 0.22 : 0.08,
          transition: "opacity 0.15s",
          pointerEvents: "none",
        }}
      />
      {/* Metallic Pin Body (scales slightly) */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS}
        fill="url(#pegMetallic)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.6"
        filter="url(#pegShadow)"
        className={isActive ? "peg-scale-active" : ""}
        style={{
          transformOrigin: `${peg.x}px ${peg.y}px`,
        }}
      />
      {/* Pure White Flash Overlay */}
      <circle
        cx={peg.x}
        cy={peg.y}
        r={PEG_RADIUS}
        fill="#ffffff"
        className={isActive ? "peg-flash-active" : ""}
        style={{
          transformOrigin: `${peg.x}px ${peg.y}px`,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      {/* Specular Highlight Dot */}
      <circle
        cx={peg.x - 1.2}
        cy={peg.y - 1.2}
        r={PEG_RADIUS * 0.3}
        fill="rgba(255,255,255,0.75)"
        className={isActive ? "peg-scale-active" : ""}
        style={{
          transformOrigin: `${peg.x}px ${peg.y}px`,
        }}
      />
    </g>
  );
}

function BinNode({ bin, idx, isActive, shouldReduceMotion }) {
  const [isHovered, setIsHovered] = useState(false);
  const isEdge = idx === 0 || idx === ROWS;
  const isHigh = bin.multiplier >= 3;

  return (
    <g
      transform={`translate(${bin.x}, ${bin.y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "default" }}
    >
      {isActive && !shouldReduceMotion && (
        <rect
          width={COL_SPACING - 4}
          height={48}
          rx={8}
          fill="none"
          stroke={isEdge ? "#fbbf24" : "#22d3ee"}
          strokeWidth={2}
          opacity={0}
          style={{
            transformOrigin: `${(COL_SPACING - 4) / 2}px 24px`,
            animation: "ripple-expand 0.8s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}
      {isActive && (
        <rect
          width={COL_SPACING - 4}
          height={48}
          rx={8}
          fill={isEdge ? "rgba(251,191,36,0.28)" : "rgba(34,211,238,0.22)"}
          style={{ animation: "glow-pulse 0.6s ease-out", pointerEvents: "none" }}
        />
      )}
      <rect
        width={COL_SPACING - 4}
        height={48}
        rx={8}
        fill={`url(#binGrad${isHigh ? "High" : "Low"})`}
        stroke={
          isActive
            ? isEdge
              ? "#fbbf24"
              : "#22d3ee"
            : isHovered
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.08)"
        }
        strokeWidth={isActive ? 2 : isHovered ? 1.5 : 1}
        style={{
          transform: isActive ? "scale(1.06)" : isHovered ? "scale(1.04)" : "scale(1)",
          transformOrigin: `${(COL_SPACING - 4) / 2}px 24px`,
          transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), stroke 0.2s, filter 0.2s",
          filter: isActive
            ? `drop-shadow(0 0 ${isEdge ? 14 : 8}px ${isEdge ? "rgba(251,191,36,0.55)" : "rgba(34,211,238,0.45)"})`
            : isHovered
            ? "drop-shadow(0 4px 12px rgba(255, 255, 255, 0.12))"
            : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      />
      <text
        x={(COL_SPACING - 4) / 2}
        y={30}
        textAnchor="middle"
        fill={isActive ? "#fff" : isHovered ? "#f4f4f5" : isHigh ? "#e4e4e7" : "#a1a1aa"}
        fontSize={isEdge ? "13" : "11"}
        fontWeight="700"
        className="pointer-events-none select-none"
        style={{
          transform: isHovered && !isActive ? "scale(1.05)" : "scale(1)",
          transformOrigin: `${(COL_SPACING - 4) / 2}px 24px`,
          transition: "transform 0.2s, fill 0.2s",
        }}
      >
        {bin.multiplier}x
      </text>
    </g>
  );
}

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
  const effectsRafRef = useRef(null);
  const animatingRef = useRef(false);
  const pegTimeoutRef = useRef(null);

  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);

  const pegs = generatePegs();
  const bins = generateBins();
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  const handleImpact = useCallback((ev) => {
    apiRef.current.addSparks(ev.x, ev.y);
    if (pegTimeoutRef.current) clearTimeout(pegTimeoutRef.current);
    setActivePeg(ev.pegId);
    pegTimeoutRef.current = setTimeout(() => setActivePeg(null), 120);
  }, [apiRef]);

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
        apiRef.current.addTrailPoint(sample.x, sample.y, sample.velocity, isGolden);
      }
      apiRef.current.draw();
    },
    [apiRef, isGolden]
  );

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
        i += 1;
        setTimeout(run, 40);
      };
      run();
    },
    [shouldReduceMotion, shakeX, shakeY]
  );

  const handleComplete = useCallback(() => {
    if (!outcome) return;

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
        particleCount: isBigWin ? 70 : 40,
        spread: isBigWin ? 75 : 55,
        origin: { x: originX, y: 0.75 },
        colors: isBigWin
          ? ["#fbbf24", "#d4a574", "#22d3ee", "#8b5cf6"]
          : ["#8b5cf6", "#22d3ee", "#a78bfa"],
        ticks: 100,
        gravity: 1.1,
        scalar: 0.85,
      });
    }

    animatingRef.current = false;
    setTimeout(() => onAnimationComplete?.(), shouldReduceMotion ? 200 : 700);
  }, [outcome, bins, onLanding, shouldReduceMotion, triggerCameraShake, onAnimationComplete]);

  const { start, reset, cancel } = useBallAnimator({
    reducedMotion: shouldReduceMotion,
    onFrame: handleFrame,
    onImpact: handleImpact,
    onComplete: handleComplete,
  });

  useEffect(() => {
    if (canvasRef.current) {
      attachCanvas(canvasRef.current, "-300 0 600 680");
    }
    return () => apiRef.current.detach?.();
  }, [attachCanvas, apiRef]);

  useEffect(() => {
    if (isDropping && outcome?.path && !animatingRef.current) {
      animatingRef.current = true;
      setActiveBin(null);
      setShowPayout(false);
      apiRef.current.clear();

      const startX = getDropStartX(outcome.dropColumn);
      reset(startX, START_Y);
      ballRef.current?.update({ x: startX, y: START_Y, sx: 1, sy: 1, rot: 0, visible: true });

      start(outcome.path, outcome.dropColumn, outcome.binIndex);
    }
  }, [isDropping, outcome, start, reset, apiRef]);

  useEffect(() => () => {
    cancel();
    if (pegTimeoutRef.current) clearTimeout(pegTimeoutRef.current);
    if (effectsRafRef.current) cancelAnimationFrame(effectsRafRef.current);
  }, [cancel]);
  const boardClass = compact
    ? "relative w-full h-[360px] sm:h-[400px]"
    : "relative w-full h-[360px] sm:h-[460px] md:h-[600px] lg:h-[680px]";

  return (
    <motion.div
      className={`${boardClass} flex items-center justify-center ${isDungeon ? "theme-dungeon" : ""}`}
      style={{
        x: shakeX,
        y: shakeY,
        willChange: "transform",
      }}
      animate={{
        rotate: isTilt ? [0, 3, -3, 0] : 0,
      }}
      transition={
        isTilt
          ? { rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
          : {}
      }
    >
      <div ref={containerRef} className="relative w-full h-full">
        {/* Volumetric glow and depth layering */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_at_50%_75%,rgba(34,211,238,0.06),transparent_55%)] pointer-events-none rounded-3xl" />

        <svg viewBox="-300 0 600 680" className="w-full h-full overflow-visible">
          <defs>
            {/* Soft drop shadow filter for pegs */}
            <filter id="pegShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45" />
            </filter>
            
            {/* Highly polished chrome reflection gradient */}
            <radialGradient id="pegMetallic" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="75%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
            
            <radialGradient id="pegGlow">
              <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </radialGradient>
            <linearGradient id="binGradLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(30,30,45,0.9)" />
              <stop offset="100%" stopColor="rgba(15,15,25,0.95)" />
            </linearGradient>
            <linearGradient id="binGradHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
              <stop offset="100%" stopColor="rgba(30,20,50,0.9)" />
            </linearGradient>
          </defs>

          {outcome && (
            <line
              x1={getDropStartX(outcome.dropColumn)}
              y1={0}
              x2={getDropStartX(outcome.dropColumn)}
              y2={START_Y - 4}
              stroke="rgba(34,211,238,0.3)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {bins.map((bin, idx) => (
            <BinNode
              key={bin.id}
              bin={bin}
              idx={idx}
              isActive={activeBin === idx}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}

          {pegs.map((peg) => (
            <g key={peg.id}>
              <PegNode
                peg={peg}
                isActive={activePeg === peg.id}
                isHovered={hoveredPeg === peg.id}
                onHover={setHoveredPeg}
              />
              {isDebug && (
                <text x={peg.x} y={peg.y - 10} fontSize="5" fill="#22d3ee" textAnchor="middle" className="font-mono" opacity={0.7}>
                  {peg.row},{peg.col}
                </text>
              )}
            </g>
          ))}
        </svg>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ willChange: "contents" }}
        />

        <BallOverlay ref={ballRef} isGolden={isGolden} containerRef={containerRef} />
      </div>

      <AnimatePresence>
        {showPayout && outcome && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel-elevated px-6 py-3 rounded-2xl text-center pointer-events-none z-30"
          >
            <div className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">Payout</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {(outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex]).toFixed(1)}x
            </div>
            {outcome.betCents && (
              <div className="text-sm text-emerald-400 font-mono mt-1">
                +${((outcome.betCents / 100) * (outcome.payoutMultiplier ?? PAYOUTS[outcome.binIndex])).toFixed(2)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isDebug && (
        <div className="absolute top-4 left-4 px-3 py-1.5 glass-panel rounded-lg text-[10px] font-mono text-cyan-400 z-30">
          DEBUG: GRID ACTIVE
        </div>
      )}
    </motion.div>
  );
}
