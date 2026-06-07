"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyService } from "../../services/api.service";
import PlinkoBoard from "../../components/PlinkoBoard";
import BackgroundEffects from "../../components/BackgroundEffects";
import CopyButton from "../../components/CopyButton";
import Link from "next/link";
import { FaShieldAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function HashField({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">{label}</span>
        {value && <CopyButton text={value} label="Copy" />}
      </div>
      <div className="bg-black/40 rounded-lg px-3 py-2.5 border border-white/5 max-h-24 overflow-y-auto">
        <p className="text-[10px] font-mono text-zinc-400 break-all leading-relaxed">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function VerifierPage() {
  const [formData, setFormData] = useState({
    serverSeed: "",
    clientSeed: "",
    nonce: "",
    dropColumn: "6",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReplay, setShowReplay] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setShowReplay(false);

    try {
      const data = await verifyService.verify(formData);
      setResult(data);
      setTimeout(() => setShowReplay(true), 300);
    } catch (err) {
      console.error("Verification failed", err);
      setError("Verification failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = result && !error;

  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />

      <div className="relative z-10 px-4 md:px-8 py-8 md:py-12 max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            href="/"
            className="text-zinc-500 hover:text-cyan-400 transition-colors flex items-center gap-2 mb-6 text-sm"
          >
            ← Back to Game
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center">
              <FaShieldAlt className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Public
                </span>{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  Verifier
                </span>
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Independently recompute any round outcome from its seeds.
              </p>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleVerify}
            className="glass-panel-elevated rounded-2xl p-6 md:p-8 flex flex-col gap-5"
          >
            <h2 className="text-sm font-semibold text-white">Round Parameters</h2>

            {[
              { key: "serverSeed", label: "Server Seed (Revealed)", placeholder: "Paste revealed serverSeed" },
              { key: "clientSeed", label: "Client Seed", placeholder: "Your client seed" },
              { key: "nonce", label: "Nonce", placeholder: "Round nonce" },
            ].map((field) => (
              <div key={field.key} className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="input-premium w-full"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Drop Column (0–12)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={formData.dropColumn}
                onChange={(e) => setFormData({ ...formData, dropColumn: e.target.value })}
                className="input-premium w-full"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Computing…
                </>
              ) : (
                "Recompute Outcome"
              )}
            </motion.button>
          </motion.form>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col min-h-[500px]"
          >
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <FaTimesCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-1">Verification Failed</h3>
                    <p className="text-sm text-zinc-500">{error}</p>
                  </div>
                </motion.div>
              ) : !result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center">
                    <FaShieldAlt className="w-6 h-6 text-zinc-600" />
                  </div>
                  <p className="text-sm text-zinc-600">Enter round details to verify fairness</p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Status badge */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
                        isSuccess
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isSuccess ? (
                        <FaCheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <FaTimesCircle className="w-3.5 h-3.5" />
                      )}
                      {isSuccess ? "Verified" : "Mismatch"}
                    </motion.div>

                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Final Bin</div>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, type: "spring" }}
                      className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
                    >
                      {result.binIndex}
                    </motion.div>
                  </div>

                  {/* Path replay */}
                  {showReplay && result.path && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 rounded-xl p-3 border border-white/5"
                    >
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mb-2 text-center">
                        Path Replay
                      </div>
                      <PlinkoBoard
                        outcome={{
                          binIndex: result.binIndex,
                          path: result.path,
                          dropColumn: parseInt(formData.dropColumn),
                          payoutMultiplier: result.payoutMultiplier,
                        }}
                        isDropping={true}
                        onAnimationComplete={() => {}}
                        compact
                      />
                    </motion.div>
                  )}

                  {/* Hash details */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <HashField label="Commit Hash (SHA-256)" value={result.commitHex} />
                    <HashField label="Combined Seed" value={result.combinedSeed} />
                    <HashField label="Peg Map Hash" value={result.pegMapHash} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { title: "Commit-Reveal", desc: "Server seed is hashed before play. Revealed only after the round." },
            { title: "Deterministic Engine", desc: "xorshift32 PRNG seeded by combined hash produces identical paths." },
            { title: "Independent Verification", desc: "Recompute any outcome locally without trusting the server." },
          ].map((item) => (
            <div key={item.title} className="glass-panel rounded-xl p-4">
              <h4 className="text-xs font-semibold text-cyan-400 mb-1">{item.title}</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
