"use client";

import { useState, useEffect, useRef } from "react";
import { soundService } from "../utils/sound";

// ─── Drop Button — glowing, reflective, animated ─────────────────────────────
function DropButton({ isDropping, disabled, onClick }) {
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);

  const addRipple = (e) => {
    if (disabled) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
  };

  return (
    <button
      ref={btnRef}
      onClick={(e) => {
        addRipple(e);
        if (!disabled) onClick();
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      disabled={disabled}
      className="relative w-full overflow-hidden select-none"
      style={{
        padding: "14px 0",
        borderRadius: "14px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled
          ? "rgba(30,27,75,0.45)"
          : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #4f46e5 100%)",
        boxShadow: disabled
          ? "none"
          : pressed
            ? "0 2px 12px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 0 0 1px rgba(139,92,246,0.5), 0 4px 28px rgba(109,40,217,0.55), 0 0 60px rgba(109,40,217,0.18), inset 0 1px 0 rgba(255,255,255,0.18)",
        transform: pressed && !disabled ? "scale(0.982)" : "scale(1)",
        transition:
          "transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease",
        opacity: disabled ? 0.42 : 1,
      }}
    >
      {/* Ambient back-glow */}
      {!disabled && (
        <div
          style={{
            position: "absolute",
            inset: "-2px",
            borderRadius: "16px",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(79,70,229,0.25) 100%)",
            filter: "blur(12px)",
            zIndex: -1,
            animation: "btnGlow 2.8s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Shimmer sweep */}
      {!disabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmerSweep 2.2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top glass shine */}
      {!disabled && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
            borderRadius: "14px 14px 0 0",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Click ripples */}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          style={{
            position: "absolute",
            left: rp.x,
            top: rp.y,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.4)",
            animation: "rippleOut 0.65s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Label */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#fff",
          fontFamily: "'Inter','SF Pro Display',sans-serif",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.03em",
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      >
        {isDropping ? (
          <>
            <svg
              style={{
                animation: "spin 0.8s linear infinite",
                width: 16,
                height: 16,
                opacity: 0.85,
              }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.3"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Dropping…</span>
          </>
        ) : (
          <>
            {/* Ball icon */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 32% 28%, #fff 0%, #e0e8ff 28%, #94a3b8 55%, #1e3a5f 100%)",
                boxShadow:
                  "inset 0 1.5px 2px rgba(255,255,255,0.9), inset 0 -1.5px 3px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)",
                flexShrink: 0,
              }}
            />
            <span>Drop Ball</span>
          </>
        )}
      </div>

      <style>{`
        @keyframes btnGlow    { 0%{opacity:0.7;} 100%{opacity:1;} }
        @keyframes shimmerSweep { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes rippleOut  { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(18);opacity:0} }
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </button>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
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
      {children}
    </span>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function GameInput({ className = "", style = {}, ...props }) {
  return (
    <input
      className={className}
      style={{
        width: "100%",
        background: "rgba(0,0,0,0.38)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 12,
        color: "#e2e8f0",
        outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(139,92,246,0.55)";
        e.target.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.15)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(255,255,255,0.08)";
        e.target.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

function BetChip({ label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "6px 0",
        borderRadius: 7,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono',monospace",
        cursor: disabled ? "not-allowed" : "pointer",
        border: active
          ? "1px solid rgba(139,92,246,0.55)"
          : "1px solid rgba(255,255,255,0.07)",
        background: active ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
        color: active ? "#a78bfa" : "#64748b",
        transition: "all 0.12s",
        opacity: disabled ? 0.42 : 1,
      }}
    >
      {label}
    </button>
  );
}

function KbRow({ keys, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "2px 0",
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {(Array.isArray(keys) ? keys : [keys]).map((k) => (
          <kbd
            key={k}
            style={{
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 9,
              fontFamily: "monospace",
              color: "#cbd5e1",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderBottom: "2px solid rgba(255,255,255,0.12)",
            }}
          >
            {k}
          </kbd>
        ))}
      </div>
      <span style={{ fontSize: 10, color: "#475569" }}>{action}</span>
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
    <div
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#7c3aed",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <button
          onClick={copy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 9,
            background: "none",
            border: "none",
            color: copied ? "#34d399" : "#475569",
            cursor: "pointer",
            transition: "color 0.15s",
            padding: 0,
          }}
        >
          {copied ? (
            <>
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
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied
            </>
          ) : (
            <>
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
                  strokeWidth={1.5}
                />
                <path
                  d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                  strokeWidth={1.5}
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div
        style={{
          fontSize: 8,
          fontFamily: "monospace",
          color: "#475569",
          wordBreak: "break-all",
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Main Controls ─────────────────────────────────────────────────────────────
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
    const n = !muted;
    soundService.setMute(n);
    setMuted(n);
  };

  const CHIPS = [1, 5, 10, 25];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        height: "100%",
        overflowY: "auto",
        fontFamily: "'Inter',sans-serif",
        scrollbarWidth: "none",
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
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "-0.01em",
          }}
        >
          Controls
        </span>
        <button
          onClick={toggleMute}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>

      {/* Bet amount */}
      <FieldGroup label="Bet Amount ($)">
        <GameInput
          type="number"
          value={betAmount}
          onChange={(e) => {
            setBetAmount(parseFloat(e.target.value) || 0);
            setActiveChip(null);
          }}
          disabled={isDropping}
          step="0.5"
          min="0.5"
          style={{ textAlign: "right" }}
        />
        <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
          {CHIPS.map((v) => (
            <BetChip
              key={v}
              label={`$${v}`}
              active={activeChip === v}
              disabled={isDropping}
              onClick={() => {
                setBetAmount(v);
                setActiveChip(v);
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            ["½", 0.5],
            ["2×", 2],
          ].map(([lbl, f]) => (
            <BetChip
              key={lbl}
              label={lbl}
              disabled={isDropping}
              onClick={() => {
                setBetAmount((p) => Math.max(0.5, parseFloat(p || 0) * f));
                setActiveChip(null);
              }}
            />
          ))}
          <BetChip label="Max" disabled={isDropping} onClick={() => {}} />
        </div>
      </FieldGroup>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

      {/* Client seed */}
      <FieldGroup label="Client Seed">
        <div style={{ display: "flex", gap: 6 }}>
          <GameInput
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            disabled={isDropping}
            style={{ flex: 1, fontSize: 11 }}
          />
          <button
            disabled={isDropping}
            onClick={() =>
              setClientSeed(Math.random().toString(36).slice(2, 14))
            }
            style={{
              padding: "0 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b",
              cursor: isDropping ? "not-allowed" : "pointer",
              opacity: isDropping ? 0.4 : 1,
              transition: "all 0.15s",
            }}
            title="Randomize"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </FieldGroup>

      {/* Drop column */}
      <FieldGroup label="Drop Column">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 9, color: "#475569" }}>0 (Left)</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "monospace",
              color: "#8b5cf6",
              textShadow: "0 0 18px rgba(139,92,246,0.65)",
              letterSpacing: "-0.03em",
            }}
          >
            {dropColumn}
          </span>
          <span style={{ fontSize: 9, color: "#475569" }}>12 (Right)</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="1"
          value={dropColumn}
          onChange={(e) => setDropColumn(parseInt(e.target.value))}
          disabled={isDropping}
          style={{
            width: "100%",
            accentColor: "#7c3aed",
            cursor: isDropping ? "not-allowed" : "pointer",
          }}
        />
        {/* Tick marks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 3,
          }}
        >
          {Array.from({ length: 13 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 1.5,
                height: 6,
                borderRadius: 1,
                background:
                  i === dropColumn ? "#7c3aed" : "rgba(255,255,255,0.1)",
                transition: "background 0.1s",
              }}
            />
          ))}
        </div>
      </FieldGroup>

      {/* Drop button */}
      <DropButton
        isDropping={isDropping}
        disabled={isDropping || !roundId}
        onClick={onDrop}
      />

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

      {/* Keyboard shortcuts */}
      <div
        style={{
          background: "rgba(139,92,246,0.05)",
          border: "1px solid rgba(139,92,246,0.12)",
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        <Label>Keyboard Shortcuts</Label>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <KbRow keys={["←", "→"]} action="Move column" />
          <KbRow keys="Space" action="Drop ball" />
          <KbRow keys="T" action="Tilt board" />
          <KbRow keys="G" action="Debug mode" />
        </div>
      </div>

      {/* Provably fair hashes */}
      {roundId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <HashBlock label="Round ID" value={roundId} />
          <HashBlock label="Commit Hash" value={commitHex} />
          <button
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              color: "#64748b",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Verify Round →
          </button>
        </div>
      )}
    </div>
  );
}
