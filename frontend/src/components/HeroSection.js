"use client";

import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-4 md:mb-8"
    >
      <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
        <span className="badge-fair text-[9px] px-2 py-0.5">Provably Fair</span>
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">
          Commit-Reveal Protocol
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-1 md:mb-3">
        <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Plinko
        </span>{" "}
        <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
          Lab
        </span>
      </h1>

      <p className="text-xs md:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed px-4 hidden sm:block">
        Drop the ball through 12 rows of pegs. Every outcome is deterministic,
        pre-committed, and independently verifiable.
      </p>
    </motion.header>
  );
}
