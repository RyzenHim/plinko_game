"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Countdown ring ───────────────────────────────────────────────────────────
function CountdownRing({ seconds, total }) {
  const r = 10;
  const circ = 2 * Math.PI * r;
  const pct = seconds / total;
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="rgba(52,211,153,0.1)"
        strokeWidth="2"
      />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s linear" }}
      />
      <text
        x="14"
        y="14"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "14px 14px",
          fontSize: 9,
          fontWeight: 700,
          fontFamily: "monospace",
          fill: "#34d399",
        }}
      >
        {seconds}
      </text>
    </svg>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text || copied) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
        border: copied
          ? "1px solid rgba(52,211,153,0.25)"
          : "1px solid rgba(255,255,255,0.08)",
        color: copied ? "#34d399" : "#94a3b8",
        cursor: "pointer",
        transition: "all 0.18s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          e.currentTarget.style.color = "#cbd5e1";
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            <svg
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            <svg
              width="10"
              height="10"
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
                strokeWidth={1.6}
              />
              <path
                d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                strokeWidth={1.6}
              />
            </svg>
            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Hash field ───────────────────────────────────────────────────────────────
function HashField({ label, value, accent, truncate }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: "#64748b",
            fontWeight: 600,
            fontFamily: "'Inter',sans-serif",
          }}
        >
          {label}
        </span>
        <CopyBtn text={value} />
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.38)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "8px 12px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            color: accent ? "#a1f2c7" : "#cbd5e1", // Reduced contrast
            wordBreak: "break-all",
            lineHeight: 1.55,
            ...(truncate && {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }),
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Server Seed Reveal ───────────────────────────────────────────────────────
const REVEAL_DURATION = 10;

function ServerSeedReveal({ serverSeed }) {
  const [seconds, setSeconds] = useState(REVEAL_DURATION);
  const [visible, setVisible] = useState(true);
  const t = useRef(null);

  useEffect(() => {
    setSeconds(REVEAL_DURATION);
    setVisible(true);
    t.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t.current);
          setTimeout(() => setVisible(false), 400);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t.current);
  }, [serverSeed]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              margin: "10px 0",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CountdownRing seconds={seconds} total={REVEAL_DURATION} />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Server Seed
                  </div>
                  <div style={{ fontSize: 9.5, color: "#475569" }}>
                    Hides in {seconds}s
                  </div>
                </div>
              </div>
              <CopyBtn text={serverSeed} />
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.38)",
                border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  color: "#a1f2c7",
                  wordBreak: "break-all",
                  lineHeight: 1.55,
                }}
              >
                {serverSeed}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main FairnessPanel ───────────────────────────────────────────────────────
export default function FairnessPanel({
  roundId,
  commitHex,
  nonce,
  status = "committed",
  serverSeed,
}) {
  const isRevealed = status === "REVEALED" || !!serverSeed;

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
              background: isRevealed
                ? "rgba(52,211,153,0.08)"
                : "rgba(124,111,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke={isRevealed ? "#34d399" : "#a78bfa"}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              Provably Fair
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              SHA-256 • COMMIT-REVEAL
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: isRevealed
              ? "rgba(52,211,153,0.1)"
              : "rgba(124,111,255,0.1)",
            color: isRevealed ? "#34d399" : "#a78bfa",
          }}
        >
          {isRevealed ? "REVEALED" : "COMMITTED"}
        </div>
      </div>

      {/* Description - Smaller & lower contrast like left panel */}
      <p
        style={{
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.6,
          margin: "2px 0 0 0",
        }}
      >
        Outcomes are pre-committed via SHA-256. Verify any round independently.
      </p>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Fields */}
      <HashField label="Round ID" value={roundId} truncate />
      <HashField label="Nonce" value={nonce} truncate />
      <HashField label="Commit Hash" value={commitHex} />

      {serverSeed && <ServerSeedReveal serverSeed={serverSeed} />}

      {/* Verifier Button */}
      <Link
        href="/verify"
        style={{
          marginTop: 6,
          padding: "10px 0",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          color: "#a78bfa",
          background: "rgba(124,111,255,0.06)",
          border: "1px solid rgba(124,111,255,0.15)",
          textAlign: "center",
          textDecoration: "none",
          transition: "all 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
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
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        Open Verifier
      </Link>
    </div>
  );
}
