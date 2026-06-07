"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function RecentResults({ results = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel rounded-2xl p-5 flex flex-col gap-3"
    >
      <h3 className="text-sm font-semibold text-white tracking-wide">Recent Results</h3>

      {results.length === 0 ? (
        <p className="text-xs text-zinc-600 py-4 text-center">No drops yet this session</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          <AnimatePresence initial={false}>
            {results.map((r, i) => (
              <motion.div
                key={r.id || i}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/30 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      r.multiplier >= 5
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : r.multiplier >= 2
                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {r.binIndex}
                  </span>
                  <div>
                    <div className="text-xs text-zinc-300 font-medium">{r.multiplier}x</div>
                    <div className="text-[10px] text-zinc-600 font-mono truncate max-w-[120px]">
                      {r.roundId?.slice(0, 8)}…
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-mono font-semibold ${
                    r.multiplier >= 1 ? "text-emerald-400" : "text-zinc-500"
                  }`}>
                    {r.payout ? `+$${r.payout.toFixed(2)}` : "—"}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
