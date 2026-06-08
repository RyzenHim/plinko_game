"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function NeonLoadingOverlay({
  visible,
  title = "Connecting…",
  subtitle = "Preparing the game engine and syncing with the server.",
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />

          {/* glass panel */}
          <motion.div
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_0_60px_rgba(34,211,238,0.15)]"
            initial={{ y: 14, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[280px] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.25),transparent_60%)]" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[420px] h-[280px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),transparent_60%)]" />
            </div>

            <div className="relative p-6 md:p-7 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.35),transparent_55%)]" />
                  <div className="relative w-8 h-8 rounded-full border border-cyan-400/30 border-t-cyan-300/70 animate-spin" />
                </div>
                <div>
                  <div className="text-sm md:text-base font-semibold text-white">
                    {title}
                  </div>
                  <div className="text-xs md:text-sm text-zinc-400 mt-0.5 leading-relaxed">
                    {subtitle}
                  </div>
                </div>
              </div>

              <div className="mt-1">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400/70 via-violet-400/70 to-cyan-400/70"
                    initial={{ width: "10%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                  Tip: outcomes are deterministic (commit-reveal). Once loaded,
                  you’ll be able to verify every round.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
