"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Multiplier badge ─────────────────────────────────────────────────────────
function MultBadge({ multiplier, binIndex }) {
  const isHigh = multiplier >= 5;
  const isMed = multiplier >= 2 && multiplier < 5;

  const color = isHigh ? "#fbbf24" : isMed ? "#a78bfa" : "#64748b";
  const bg = isHigh
    ? "rgba(245,158,11,0.08)"
    : isMed
      ? "rgba(167,139,250,0.08)"
      : "rgba(255,255,255,0.04)";

  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: bg,
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: 10,
        fontWeight: 800,
        fontFamily: "'JetBrains Mono',monospace",
        color,
      }}
    >
      {binIndex}
    </div>
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ result, index }) {
  const { multiplier, binIndex, roundId, payout } = result;
  const isHigh = multiplier >= 5;
  const isMed = multiplier >= 2 && multiplier < 5;

  const multColor = isHigh ? "#fbbf24" : isMed ? "#a78bfa" : "#64748b";
  const payColor = payout > 0 ? "#34d399" : "#64748b";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ duration: 0.22 }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          borderRadius: 10,
          background: "rgba(0,0,0,0.38)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 6,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.45)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.38)")
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MultBadge multiplier={multiplier} binIndex={binIndex} />

          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: multColor,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {multiplier}x
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                fontFamily: "'JetBrains Mono',monospace",
                marginTop: 1,
              }}
            >
              {roundId?.slice(0, 8)}…
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono',monospace",
            color: payColor,
          }}
        >
          {payout != null ? `+$${payout.toFixed(2)}` : "—"}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 0",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="#64748b"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v5l3 3" />
        </svg>
      </div>
      <p
        style={{ margin: 0, fontSize: 12.5, color: "#94a3b8", fontWeight: 500 }}
      >
        No drops yet
      </p>
      <p style={{ margin: 0, fontSize: 10.5, color: "#475569" }}>
        Drop your first ball to see results
      </p>
    </div>
  );
}

// ─── Summary row ─────────────────────────────────────────────────────────────
function Summary({ results }) {
  if (!results.length) return null;

  const totalProfit = results.reduce((s, r) => s + (r.payout ?? 0), 0);
  const best = Math.max(...results.map((r) => r.multiplier || 0));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.38)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
          {results.length}
        </div>
        <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
          Drops
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
          {best}x
        </div>
        <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
          Best
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: totalProfit >= 0 ? "#34d399" : "#f87171",
          }}
        >
          {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
        </div>
        <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
          Profit
        </div>
      </div>
    </div>
  );
}

// ─── Main RecentResults ───────────────────────────────────────────────────────
export default function RecentResults({ results = [] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? results : results.slice(0, 6);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: "100%",
        fontFamily: "'Inter',sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(124,111,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#a78bfa"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              Recent Results
            </div>
            {results.length > 0 && (
              <div
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                }}
              >
                {results.length} drop{results.length !== 1 ? "s" : ""} this
                session
              </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 9px",
              borderRadius: 999,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "rgba(52,211,153,0.08)",
              color: "#34d399",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 6px rgba(52,211,153,0.7)",
                animation: "livePulse 2s ease-in-out infinite",
              }}
            />
            LIVE
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Summary */}
      <Summary results={results} />

      {/* Results List */}
      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            maxHeight: showAll ? 380 : 260,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          <AnimatePresence initial={false}>
            {displayed.map((r, i) => (
              <ResultRow key={r.id ?? i} result={r} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {results.length > 6 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            color: "#a78bfa",
            background: "rgba(124,111,255,0.06)",
            border: "1px solid rgba(124,111,255,0.15)",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(124,111,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(124,111,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(124,111,255,0.06)";
            e.currentTarget.style.borderColor = "rgba(124,111,255,0.15)";
          }}
        >
          {showAll ? "↑ Show Less" : `↓ View All ${results.length}`}
        </button>
      )}

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
