"use client";

import { useRef, useEffect, useCallback } from "react";

const MAX_TRAIL = 10;

/**
 * GPU canvas overlay: cinematic trail + precise collision sparks.
 * All effects are canvas-only — no React state, no re-renders.
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

    const mapPoint = (svgX, svgY) => {
      const parts = viewBox.split(" ").map(Number);
      const [vbX, , vbW, vbH] = parts;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
          ...mapPoint(svgX, svgY),
          life: 1,
          velocity,
          isGolden,
          born: performance.now(),
        });
        if (trail.length > MAX_TRAIL) trail.shift();
      },

      addSparks: (svgX, svgY) => {
        const origin = mapPoint(svgX, svgY);
        const now = performance.now();

        // Bright localized flash
        flashes.push({ x: origin.x, y: origin.y, born: now, duration: 90 });

        // Crisp expanding ring
        ripples.push({ x: origin.x, y: origin.y, born: now, duration: 110 });

        // 5 micro spark particles (fan upward)
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
          const speed = 0.5 + Math.random() * 1.1;
          sparks.push({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3,
            born: now,
            duration: 140,
          });
        }
      },

      draw: () => {
        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, size.w, size.h);
        const now = performance.now();

        // ── Trail ────────────────────────────────────────────
        for (let i = 1; i < trail.length; i++) {
          const p = trail[i];
          const prev = trail[i - 1];
          const age = (now - p.born) / 200;
          p.life = Math.max(0, 1 - age);
          if (p.life <= 0 || prev.life <= 0) continue;

          const progress = i / trail.length;
          const speedBoost = Math.min(1.2, 0.3 + p.velocity * 0.035);
          const alpha = p.life * 0.38 * Math.pow(progress, 1.8) * speedBoost;
          const width = 9 * progress * 0.55;

          const color = p.isGolden ? "251,191,36" : "210,220,255";
          const grad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
          grad.addColorStop(0, `rgba(${color},0)`);
          grad.addColorStop(1, `rgba(${color},${alpha.toFixed(3)})`);

          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = width;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();

          // Soft radial glow dot at each point
          const dotGrad = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            width * 1.2,
          );
          dotGrad.addColorStop(0, `rgba(${color},${(alpha * 0.5).toFixed(3)})`);
          dotGrad.addColorStop(1, `rgba(${color},0)`);
          ctx.save();
          ctx.fillStyle = dotGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, width * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // ── Collision flashes ────────────────────────────────
        for (const f of flashes) {
          const progress = Math.min(1, (now - f.born) / f.duration);
          const alpha = 0.75 * (1 - progress);
          const radius = 6 * (1 - progress * 0.25);
          if (alpha <= 0) continue;

          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad.addColorStop(0.35, `rgba(130,200,255,${alpha * 0.5})`);
          grad.addColorStop(1, "rgba(34,211,238,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Ripple rings ─────────────────────────────────────
        for (const r of ripples) {
          const progress = Math.min(1, (now - r.born) / r.duration);
          const alpha = 0.55 * (1 - progress);
          const radius = 3 + 10 * progress;
          if (alpha <= 0) continue;

          ctx.save();
          ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // ── Micro spark particles ────────────────────────────
        for (const s of sparks) {
          const age = now - s.born;
          const progress = Math.min(1, age / s.duration);
          const alpha = 0.85 * (1 - progress);
          if (alpha <= 0) continue;

          const t = age / 1000;
          const curX = s.x + s.vx * age * 0.055;
          const curY = s.y + s.vy * age * 0.055 + 0.5 * 9.8 * t * t;
          const r = 1.4 * (1 - progress * 0.5);

          ctx.fillStyle = `rgba(150,210,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(curX, curY, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Cleanup ──────────────────────────────────────────
        for (let i = trail.length - 1; i >= 0; i--) {
          if (trail[i].life <= 0) trail.splice(i, 1);
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          if (now - sparks[i].born >= sparks[i].duration) sparks.splice(i, 1);
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          if (now - flashes[i].born >= flashes[i].duration)
            flashes.splice(i, 1);
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (now - ripples[i].born >= ripples[i].duration)
            ripples.splice(i, 1);
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

/**
 * Standalone canvas component (use if not using hook form).
 */
export default function BallEffectsCanvas({
  viewBox = "-300 0 600 680",
  className = "",
}) {
  const canvasRef = useRef(null);
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  useEffect(() => {
    if (canvasRef.current) attachCanvas(canvasRef.current, viewBox);
    return () => apiRef.current.detach();
  }, [attachCanvas, viewBox, apiRef]);

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      apiRef.current.draw();
      requestAnimationFrame(tick);
    };
    tick();
    return () => {
      active = false;
    };
  }, [apiRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ willChange: "contents" }}
    />
  );
}
