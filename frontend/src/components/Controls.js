"use client";

import { useState, useEffect, useCallback } from "react";
import { soundService } from "../utils/sound";

// ─── Sub-components ──────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-500">
      {children}
    </span>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InputBase({ className = "", ...props }) {
  return (
    <input
      className={`
        w-full bg-black/40 border border-white/[0.08] rounded-lg
        px-3 py-2 text-sm font-mono text-slate-100
        placeholder-slate-600
        focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/40
        disabled:opacity-40 disabled:cursor-not-allowed
        transition-all duration-150
        ${className}
      `}
      {...props}
    />
  );
}

function BetChip({ label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 py-1.5 rounded-md text-[11px] font-bold font-mono
        border transition-all duration-120
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          active
            ? "bg-violet-600/25 border-violet-500/50 text-violet-300"
            : "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300"
        }
      `}
    >
      {label}
    </button>
  );
}

function DropButton({ isDropping, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        relative w-full py-3.5 rounded-xl font-bold text-base
        overflow-hidden transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-[0.98]
        group
      "
      style={{
        background: disabled
          ? "rgba(30,27,75,0.5)"
          : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)",
        boxShadow: disabled
          ? "none"
          : "0 4px 24px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {/* Shimmer overlay */}
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
      )}

      <div className="relative flex items-center justify-center gap-2.5 text-white">
        {isDropping ? (
          <>
            <svg
              className="animate-spin w-4 h-4 opacity-80"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Dropping…</span>
          </>
        ) : (
          <>
            {/* Ball icon */}
            <div
              className="w-4 h-4 rounded-full bg-white/90 shadow-inner flex-shrink-0"
              style={{
                boxShadow:
                  "inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.8)",
              }}
            />
            <span>Drop Ball</span>
          </>
        )}
      </div>
    </button>
  );
}

function KbShortcut({ keys, action }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <div className="flex gap-1">
        {(Array.isArray(keys) ? keys : [keys]).map((k) => (
          <kbd
            key={k}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 bg-white/[0.06] border border-white/[0.12] border-b-[2px]"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-[10px] text-slate-500">{action}</span>
    </div>
  );
}

function HashBlock({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-lg bg-black/30 border border-white/[0.05] p-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-semibold tracking-wider uppercase text-violet-400/80">
          {label}
        </span>
        <button
          onClick={copy}
          className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg
                className="w-3 h-3 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  strokeWidth={1.5}
                />
                <path
                  d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                  strokeWidth={1.5}
                />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="text-[9px] font-mono text-slate-400 break-all leading-relaxed">
        {value}
      </div>
    </div>
  );
}

// ─── Main Controls ───────────────────────────────────────────────────────────
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
  const [activeChip, setActiveChip] = useState(null);

  useEffect(() => {
    setMuted(soundService.getMute());
  }, []);

  const toggleMute = () => {
    const next = !muted;
    soundService.setMute(next);
    setMuted(next);
  };

  const setBet = (v) => {
    setBetAmount(v);
    setActiveChip(v);
  };
  const adjBet = (factor) => {
    setBetAmount((prev) => Math.max(0.5, parseFloat(prev || 0) * factor));
    setActiveChip(null);
  };

  // Keyboard handler
  // useEffect(() => {
  //   const handler = (e) => {
  //     if (e.key === "ArrowLeft") setDropColumn((c) => Math.max(0, c - 1));
  //     if (e.key === "ArrowRight") setDropColumn((c) => Math.min(12, c + 1));
  //     if (e.key === " ") {
  //       e.preventDefault();
  //       if (!isDropping) onDrop();
  //     }
  //   };
  //   window.addEventListener("keydown", handler);
  //   return () => window.removeEventListener("keydown", handler);
  // }, [isDropping, onDrop, setDropColumn]);

  const CHIPS = [1, 5, 10, 25];

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto pr-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-200 tracking-tight">
          Controls
        </h2>
        <button
          onClick={toggleMute}
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>

      {/* Bet Amount */}
      <FieldGroup label="Bet Amount ($)">
        <div className="flex items-center gap-2">
          <InputBase
            type="number"
            value={betAmount}
            onChange={(e) => {
              setBetAmount(parseFloat(e.target.value));
              setActiveChip(null);
            }}
            disabled={isDropping}
            step="0.5"
            min="0.5"
            className="flex-1 text-right"
          />
        </div>
        <div className="flex gap-1.5">
          {CHIPS.map((v) => (
            <BetChip
              key={v}
              label={`$${v}`}
              active={activeChip === v}
              disabled={isDropping}
              onClick={() => setBet(v)}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <BetChip
            label="½"
            disabled={isDropping}
            onClick={() => adjBet(0.5)}
          />
          <BetChip label="2×" disabled={isDropping} onClick={() => adjBet(2)} />
          <BetChip label="Max" disabled={isDropping} onClick={() => {}} />
        </div>
      </FieldGroup>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Client Seed */}
      <FieldGroup label="Client Seed">
        <div className="flex gap-1.5">
          <InputBase
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            disabled={isDropping}
            className="flex-1 text-xs"
          />
          <button
            disabled={isDropping}
            onClick={() =>
              setClientSeed(Math.random().toString(36).slice(2, 14))
            }
            className="px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all disabled:opacity-40"
            title="Randomize seed"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </FieldGroup>

      {/* Drop Column */}
      <FieldGroup label={`Drop Column`}>
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-[10px] text-slate-500">0 (Left)</span>
          <span
            className="text-xl font-bold font-mono text-violet-400"
            style={{ textShadow: "0 0 16px rgba(139,92,246,0.6)" }}
          >
            {dropColumn}
          </span>
          <span className="text-[10px] text-slate-500">12 (Right)</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={dropColumn}
          onChange={(e) => setDropColumn(parseInt(e.target.value))}
          disabled={isDropping}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-40"
          style={{ accentColor: "#7c3aed" }}
        />
        <div className="flex justify-between px-0.5 mt-0.5">
          {Array.from({ length: 13 }, (_, i) => (
            <div
              key={i}
              className="w-px h-1.5 rounded-full transition-colors duration-100"
              style={{
                background:
                  i === dropColumn ? "#7c3aed" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </FieldGroup>

      {/* Drop Button */}
      <DropButton
        isDropping={isDropping}
        disabled={isDropping || !roundId}
        onClick={onDrop}
      />

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Keyboard shortcuts */}
      <div className="rounded-xl bg-violet-500/[0.05] border border-violet-500/[0.12] p-3">
        <Label>Keyboard Shortcuts</Label>
        <div className="mt-2 flex flex-col gap-1">
          <KbShortcut keys={["←", "→"]} action="Move column" />
          <KbShortcut keys="Space" action="Drop ball" />
          <KbShortcut keys="T" action="Tilt board" />
          <KbShortcut keys="G" action="Debug" />
        </div>
      </div>

      {/* Provably fair hashes */}
      {roundId && (
        <div className="flex flex-col gap-2">
          <HashBlock label="Round ID" value={roundId} />
          <HashBlock label="Commit Hash" value={commitHex} />
          <button className="w-full py-2 rounded-lg text-[11px] font-medium text-slate-400 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-slate-200 transition-all">
            Verify Round →
          </button>
        </div>
      )}
    </div>
  );
}
