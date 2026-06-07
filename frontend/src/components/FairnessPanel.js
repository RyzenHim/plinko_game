"use client";

import { motion } from "framer-motion";
import CopyButton from "./CopyButton";
import Link from "next/link";

export default function FairnessPanel({ roundId, commitHex, nonce, status = "committed", serverSeed }) {
  const isRevealed = status === "REVEALED" || !!serverSeed;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel-elevated rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white tracking-wide">Provably Fair</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isRevealed
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRevealed ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"}`} />
          {isRevealed ? "Revealed" : "Committed"}
        </span>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed">
        Outcomes are pre-committed via SHA-256. Verify any round independently.
      </p>

      {roundId && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Round ID</span>
            <CopyButton text={roundId} label="Copy" />
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5">
            <p className="text-[11px] font-mono text-zinc-400 truncate">{roundId}</p>
          </div>
        </div>
      )}

      {nonce && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Nonce</span>
            <CopyButton text={nonce} label="Copy" />
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5">
            <p className="text-[11px] font-mono text-zinc-400">{nonce}</p>
          </div>
        </div>
      )}

      {commitHex && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Commit Hash</span>
            <CopyButton text={commitHex} label="Copy" />
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5 max-h-20 overflow-y-auto">
            <p className="text-[10px] font-mono text-zinc-400 break-all leading-relaxed">{commitHex}</p>
          </div>
        </div>
      )}

      {serverSeed && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Server Seed</span>
            <CopyButton text={serverSeed} label="Copy" />
          </div>
          <div className="bg-black/40 rounded-lg px-3 py-2 border border-emerald-500/20 max-h-20 overflow-y-auto">
            <p className="text-[10px] font-mono text-emerald-400/80 break-all leading-relaxed">{serverSeed}</p>
          </div>
        </div>
      )}

      <Link
        href="/verify"
        className="mt-1 w-full py-2.5 rounded-xl text-center text-xs font-semibold text-cyan-400 border border-cyan-500/25 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
      >
        Open Verifier →
      </Link>
    </motion.div>
  );
}
