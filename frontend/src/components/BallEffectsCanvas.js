"use client";

import { useRef, useEffect, useCallback } from "react";

const MAX_TRAIL = 8; // Short trail only

/**
 * GPU-friendly canvas overlay hook for trail + sparks.
 * Uses performant canvas draws without React state updates.
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
      const [, , vbW, vbH] = viewBox.split(" ").map(Number);
      const rect = canvasEl.parentElement?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: ((svgX - -300) / vbW) * rect.width,
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

        // 1. Tiny Flash (localized bright reflection burst)
        flashes.push({
          x: origin.x,
          y: origin.y,
          born: now,
          duration: 100, // 100ms
        });

        // 2. Micro Ripple (fine circle expanding outwards)
        ripples.push({
          x: origin.x,
          y: origin.y,
          born: now,
          duration: 120, // 120ms
        });

        // 3. Micro Sparks (4-5 tiny particles drifting with gravity)
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // bounce upwards
          const speed = 0.6 + Math.random() * 1.2;
          sparks.push({
            x: origin.x,
            y: origin.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.4,
            born: now,
            duration: 150, // 150ms
          });
        }
      },
      draw: () => {
        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, size.w, size.h);
        const now = performance.now();

        // 1. Draw elegant metallic trail streaks (silver/white or gold)
        for (let i = 0; i < trail.length; i++) {
          const p = trail[i];
          const age = (now - p.born) / 180; // Fades in 180ms
          p.life = Math.max(0, 1 - age);
          if (p.life <= 0) continue;

          const progress = i / trail.length;
          // Subtly scale opacity and width with speed and position
          const alpha = p.life * 0.35 * Math.pow(progress, 2.0) * Math.min(1.2, 0.4 + p.velocity * 0.04);
          const radius = 9 * progress * 0.5;

          if (i > 0 && trail[i - 1].life > 0) {
            const prev = trail[i - 1];
            const grad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
            const color = p.isGolden ? "251, 191, 36" : "226, 232, 240"; // silver-white
            grad.addColorStop(0, `rgba(${color}, 0)`);
            grad.addColorStop(1, `rgba(${color}, ${alpha})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = radius * 0.8;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.isGolden
            ? `rgba(251, 191, 36, ${alpha * 0.4})`
            : `rgba(226, 232, 240, ${alpha * 0.3})`;
          ctx.fill();
        }

        // 2. Draw collision flashes (max size: 1.5x peg diameter)
        for (const f of flashes) {
          const age = now - f.born;
          const progress = Math.min(1, age / f.duration);
          const alpha = 0.6 * (1 - progress);
          const radius = 7 * (1 - progress * 0.3); // max 7px (1.4x peg radius)
          if (alpha <= 0) continue;

          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          grad.addColorStop(0.4, `rgba(34, 211, 238, ${alpha * 0.4})`);
          grad.addColorStop(1, "rgba(34, 211, 238, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Draw collision ripples (max size: 1.5x peg diameter)
        for (const r of ripples) {
          const age = now - r.born;
          const progress = Math.min(1, age / r.duration);
          const alpha = 0.5 * (1 - progress);
          const radius = 4 + 8 * progress; // expands 4px to 12px
          if (alpha <= 0) continue;

          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 4. Draw micro particle sparks
        for (const s of sparks) {
          const age = now - s.born;
          const progress = Math.min(1, age / s.duration);
          const alpha = 0.8 * (1 - progress);
          if (alpha <= 0) continue;

          const t = age / 1000;
          const curX = s.x + s.vx * age * 0.05;
          const curY = s.y + s.vy * age * 0.05 + 0.5 * 9.8 * t * t; // fall with gravity

          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.beginPath();
          ctx.arc(curX, curY, 1.2 * (1 - progress), 0, Math.PI * 2);
          ctx.fill();
        }

        // Clean up expired items
        for (let i = trail.length - 1; i >= 0; i--) {
          if (trail[i].life <= 0) trail.splice(i, 1);
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          if (now - sparks[i].born >= sparks[i].duration) sparks.splice(i, 1);
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          if (now - flashes[i].born >= flashes[i].duration) flashes.splice(i, 1);
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          if (now - ripples[i].born >= ripples[i].duration) ripples.splice(i, 1);
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
 * Fallback Component wrapper in case direct DOM canvas mounting is used.
 */
export default function BallEffectsCanvas({ viewBox = "-300 0 600 680", className = "" }) {
  const canvasRef = useRef(null);
  const { apiRef, attachCanvas } = useBallEffectsCanvas();

  useEffect(() => {
    if (canvasRef.current) {
      attachCanvas(canvasRef.current, viewBox);
    }
    return () => apiRef.current.detach();
  }, [attachCanvas, viewBox, apiRef]);

  // Handle frame loop ticks if component-driven
  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      apiRef.current.draw();
      requestAnimationFrame(tick);
    };
    tick();
    return () => { active = false; };
  }, [apiRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ willChange: "contents" }}
    />
  );
}
