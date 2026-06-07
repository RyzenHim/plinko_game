"use client";

import { FaVolumeUp, FaVolumeMute, FaPlay } from "react-icons/fa";
import { motion } from "framer-motion";
import { soundService } from "../utils/sound";
import { useEffect, useState } from "react";
import Link from "next/link";
import CopyButton from "./CopyButton";

export default function Controls({
  betAmount,
  setBetAmount,
  clientSeed,
  setClientSeed,
  dropColumn,
  setDropColumn,
  onDrop,
  isDropping,
  roundId,
  commitHex,
}) {
  const [muted, setMuted] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const sliderProgress = (dropColumn / 12) * 100;

  const handleDropClick = () => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 600);
    onDrop();
  };

  useEffect(() => {
    setMuted(soundService.getMute());
  }, []);

  const toggleMute = () => {
    const newVal = !muted;
    soundService.setMute(newVal);
    setMuted(newVal);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel-elevated rounded-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Controls</h2>
        <button
          onClick={toggleMute}
          className="btn-ghost p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300"
          title={muted ? "Unmute" : "Mute"}
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <FaVolumeMute className="w-3.5 h-3.5" /> : <FaVolumeUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Inputs in grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bet Amount */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Bet ($)
            </label>
            <span className="text-[10px] font-mono text-cyan-400">${betAmount.toFixed(2)}</span>
          </div>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            disabled={isDropping}
            className="input-premium w-full py-2 px-2.5 text-sm"
          />
        </div>

        {/* Client Seed */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Client Seed
          </label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            disabled={isDropping}
            className="input-premium w-full py-2 px-2.5 text-sm"
            placeholder="lucky-seed"
          />
        </div>
      </div>

      {/* Drop Column */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Drop Column
          </label>
          <motion.span
            key={dropColumn}
            initial={{ scale: 1.3, color: "#22d3ee" }}
            animate={{ scale: 1, color: "#a1a1aa" }}
            className="text-xs font-mono font-bold"
          >
            {dropColumn}
          </motion.span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={dropColumn}
          onChange={(e) => setDropColumn(parseInt(e.target.value))}
          disabled={isDropping}
          className="slider-premium"
          style={{ "--slider-progress": `${sliderProgress}%` }}
          aria-label="Drop column selector"
        />
        <div className="flex justify-between text-[8px] text-zinc-600 font-mono px-0.5 mt-0.5">
          <span>0 (Left)</span>
          <span>6 (Center)</span>
          <span>12 (Right)</span>
        </div>
      </div>

      {/* Drop Button */}
      <div className="relative w-full">
        {showBurst && (
          <span className="absolute inset-0 rounded-xl pointer-events-none button-burst-effect" />
        )}
        <motion.button
          onClick={handleDropClick}
          disabled={isDropping || !roundId}
          className="btn-glass-premium w-full py-3.5 rounded-xl text-base flex items-center justify-center gap-2.5 font-bold relative overflow-hidden"
          whileHover={!isDropping && roundId ? { 
            scale: 1.03, 
            boxShadow: "0 12px 32px rgba(139, 92, 246, 0.4), 0 0 20px rgba(34, 211, 238, 0.2) inset" 
          } : {}}
          whileTap={!isDropping && roundId ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 450, damping: 14 }}
        >
          {isDropping ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full z-10"
              />
              <span className="z-10 tracking-widest text-zinc-300">Dropping…</span>
            </>
          ) : (
            <>
              <FaPlay className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_4px_#22d3ee] z-10" />
              <span className="z-10 tracking-wider">Drop Ball</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Commit Hash inline — hidden on mobile, only desktop */}
      {commitHex && (
        <div className="hidden lg:flex flex-col gap-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Commit Hash</span>
            <CopyButton text={commitHex} label="Copy" />
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5 max-h-16 overflow-y-auto">
            <p className="text-[9px] font-mono text-zinc-500 break-all leading-relaxed">{commitHex}</p>
          </div>
        </div>
      )}

      {/* Verify shortcut — hidden on mobile */}
      <Link
        href="/verify"
        className="hidden sm:block btn-ghost w-full py-2.5 rounded-xl text-center text-xs font-semibold"
      >
        Verify Round →
      </Link>

      {/* Keyboard hints — hidden on mobile */}
      <div className="hidden sm:block p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2 block">
          Keyboard
        </span>
        <div className="grid grid-cols-2 gap-y-1 text-[10px] text-zinc-500">
          <span className="font-mono text-zinc-400">← →</span>
          <span className="text-right">Move column</span>
          <span className="font-mono text-zinc-400">Space</span>
          <span className="text-right">Drop ball</span>
          <span className="font-mono text-zinc-400">T / G</span>
          <span className="text-right">Tilt / Debug</span>
        </div>
      </div>
    </motion.div>
  );
}
