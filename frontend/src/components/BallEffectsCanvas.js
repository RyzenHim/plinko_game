"use client";

import { useRef, useCallback } from "react";

const MAX_TRAIL = 14;

/**
 * Canvas overlay — cinematic ball trail + precision peg collision effects.
 * Matches the screenshot: deep blue-white energy trail, crisp cyan ripples,
 * soft flash blooms at each peg impact.
 */
export function useBallEffectsCanvas() {
  const apiRef = useRef({
    addTrailPoint: () => {},
    addSparks: () => {},
    draw: () => {},
    clear: () => {},
    detach: () => {},
  });

  const attachCanvas = useCallback((canvasEl, viewBox) => {
    if (!canvasEl) return;

    const trail = [];
    const sparks = [];
    const flashes = [];
    const ripples = [];
    let size = { w: 0, h: 0 };
    let dpr = 1;

    // Parse viewbox for coordinate mapping
    const [vbX, , vbW, vbH] = viewBox.split(" ").map(Number);

    const mapPt = (svgX, svgY) => {
      const rect = canvasEl.parentElement?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: ((svgX - vbX) / vbW) * rect.width,
        y: (svgY / vbH) * rect.height,
      };
    };

    const resize = () => {
      const parent = canvasEl.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      canvasEl.style.width = `${rect.width}px`;
      canvasEl.style.height = `${rect.height}px`;
      size = { w: rect.width, h: rect.height };
      const ctx = canvasEl.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvasEl.parentElement) ro.observe(canvasEl.parentElement);

    apiRef.current = {
      addTrailPoint: (svgX, svgY, velocity, isGolden) => {
        trail.push({
          ...mapPt(svgX, svgY),
          life: 1,
          velocity: velocity ?? 0,
          isGolden: !!isGolden,
          born: performance.now(),
        });
        if (trail.length > MAX_TRAIL) trail.shift();
      },

      addSparks: (svgX, svgY) => {
        const { x, y } = mapPt(svgX, svgY);
        const now = performance.now();

        // Bright impact flash
        flashes.push({ x, y, born: now, dur: 95 });

        // Expanding ring
        ripples.push({ x, y, born: now, dur: 120 });

        // 6 micro sparks fanning upward
        for (let i = 0; i < 6; i++) {
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
          const spd = 0.6 + Math.random() * 1.4;
          sparks.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 0.4,
            born: now,
            dur: 150 + Math.random() * 60,
          });
        }
      },

      draw: () => {
        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, size.w, size.h);
        const now = performance.now();

        // ── Trail ──────────────────────────────────────────────────────────
        // Two-pass: wide soft glow then sharp core line
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < trail.length; i++) {
            const p = trail[i];
            const prev = trail[i - 1];

            const age = (now - p.born) / 220;
            p.life = Math.max(0, 1 - age);
            if (p.life <= 0) continue;

            const progress = i / trail.length;
            const speedFact = Math.min(1.3, 0.25 + p.velocity * 0.03);
            const baseAlpha = p.life * Math.pow(progress, 1.6) * speedFact;

            if (pass === 0) {
              // Outer glow — wide, soft, blue-violet
              const a = baseAlpha * 0.28;
              const w = 14 * progress;
              const col = p.isGolden ? "251,191,36" : "160,180,255";
              const grad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
              grad.addColorStop(0, `rgba(${col},0)`);
              grad.addColorStop(1, `rgba(${col},${a.toFixed(3)})`);
              ctx.save();
              ctx.strokeStyle = grad;
              ctx.lineWidth = w;
              ctx.lineCap = "round";
              ctx.globalCompositeOperation = "screen";
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
              ctx.restore();
            } else {
              // Inner core — narrow, bright white-blue
              const a = baseAlpha * 0.72;
              const w = 3.5 * progress;
              const col = p.isGolden ? "255,230,100" : "210,228,255";
              const grad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
              grad.addColorStop(0, `rgba(${col},0)`);
              grad.addColorStop(1, `rgba(${col},${a.toFixed(3)})`);
              ctx.save();
              ctx.strokeStyle = grad;
              ctx.lineWidth = w;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(p.x, p.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Radial glow dot at trail head
        if (trail.length > 0) {
          const head = trail[trail.length - 1];
          if (head.life > 0.2) {
            const col = head.isGolden ? "251,191,36" : "148,172,255";
            const r = 8;
            const grad = ctx.createRadialGradient(
              head.x,
              head.y,
              0,
              head.x,
              head.y,
              r,
            );
            grad.addColorStop(
              0,
              `rgba(${col},${(head.life * 0.5).toFixed(3)})`,
            );
            grad.addColorStop(1, `rgba(${col},0)`);
            ctx.save();
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = "screen";
            ctx.beginPath();
            ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // ── Impact flashes ─────────────────────────────────────────────────
        for (const f of flashes) {
          const p = Math.min(1, (now - f.born) / f.dur);
          const a = 0.78 * (1 - p);
          if (a <= 0) continue;
          const r = 5 + 3 * (1 - p);
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
          grad.addColorStop(0, `rgba(255,255,255,${a})`);
          grad.addColorStop(0.4, `rgba(140,210,255,${a * 0.55})`);
          grad.addColorStop(1, "rgba(34,211,238,0)");
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ── Ripple rings ───────────────────────────────────────────────────
        for (const rp of ripples) {
          const p = Math.min(1, (now - rp.born) / rp.dur);
          const a = 0.6 * (1 - p);
          if (a <= 0) continue;
          const r = 3.5 + 10 * p;
          ctx.save();
          ctx.strokeStyle = `rgba(34,211,238,${a})`;
          ctx.lineWidth = 0.9;
          ctx.globalCompositeOperation = "screen";
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // ── Micro sparks ───────────────────────────────────────────────────
        for (const s of sparks) {
          const p = Math.min(1, (now - s.born) / s.dur);
          const a = 0.88 * (1 - p);
          if (a <= 0) continue;
          const t = (now - s.born) / 1000;
          const cx2 = s.x + s.vx * (now - s.born) * 0.06;
          const cy2 = s.y + s.vy * (now - s.born) * 0.06 + 0.5 * 9.8 * t * t;
          ctx.save();
          ctx.fillStyle = `rgba(160,220,255,${a})`;
          ctx.globalCompositeOperation = "screen";
          ctx.beginPath();
          ctx.arc(cx2, cy2, 1.5 * (1 - p * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ── Cleanup ────────────────────────────────────────────────────────
        for (let i = trail.length - 1; i >= 0; i--) {
          if (trail[i].life <= 0) trail.splice(i, 1);
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          if (now - sparks[i].born >= sparks[i].dur) sparks.splice(i, 1);
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          if (now - flashes[i].born >= flashes[i].dur) flashes.splice(i, 1);
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (now - ripples[i].born >= ripples[i].dur) ripples.splice(i, 1);
        }
      },

      clear: () => {
        trail.length = 0;
        sparks.length = 0;
        flashes.length = 0;
        ripples.length = 0;
        const ctx = canvasEl.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, size.w, size.h);
      },

      detach: () => ro.disconnect(),
    };
  }, []);

  return { apiRef, attachCanvas };
}

export default function BallEffectsCanvas({
  viewBox = "-300 0 600 680",
  className = "",
}) {
  const canvasRef = useRef(null);
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  // attach on mount
  const cbRef = useCallback(
    (el) => {
      canvasRef.current = el;
      if (el) attachCanvas(el, viewBox);
    },
    [attachCanvas, viewBox],
  );

  return (
    <canvas
      ref={cbRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ willChange: "contents" }}
    />
  );
}
