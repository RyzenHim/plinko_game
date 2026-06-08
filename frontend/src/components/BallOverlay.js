"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

const VIEWBOX = { x: -300, y: 0, w: 600, h: 680 };

/**
 * Imperative ball DOM layer.
 * Positioned via translate3d only — zero React re-renders during animation.
 */
const BallOverlay = forwardRef(function BallOverlay(
  { isGolden = false, containerRef },
  ref,
) {
  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const sizeRef = useRef({ w: 1, h: 1 });

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  const toPixel = (svgX, svgY) => {
    const { w, h } = sizeRef.current;
    return {
      px: ((svgX - VIEWBOX.x) / VIEWBOX.w) * w,
      py: ((svgY - VIEWBOX.y) / VIEWBOX.h) * h,
    };
  };

  useImperativeHandle(ref, () => ({
    update({ x, y, sx, sy, rot, velocity = 0, visible = true }) {
      const el = rootRef.current;
      if (!el) return;
      const { px, py } = toPixel(x, y);
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale3d(${sx}, ${sy}, 1) rotate(${rot}deg)`;

      if (glowRef.current) {
        // Velocity-driven glow intensity
        const intensity = Math.min(1, velocity * 0.04);
        const blur = 3 + velocity * 0.07;
        glowRef.current.style.filter = `blur(${blur.toFixed(1)}px)`;
        glowRef.current.style.opacity = (0.35 + intensity * 0.55).toFixed(2);
        glowRef.current.style.transform = `scale(${1 + intensity * 0.4})`;
      }
    },
    hide() {
      if (rootRef.current) rootRef.current.style.opacity = "0";
    },
  }));

  const BALL_SIZE = 18;

  return (
    <div
      ref={rootRef}
      className="absolute top-0 left-0 z-20 pointer-events-none"
      style={{ willChange: "transform, opacity", opacity: 0 }}
    >
      {/* Contact shadow */}
      <div
        style={{
          position: "absolute",
          width: BALL_SIZE * 1.1,
          height: BALL_SIZE * 0.3,
          left: "50%",
          top: "100%",
          marginLeft: `-${BALL_SIZE * 0.55}px`,
          marginTop: "4px",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
          filter: "blur(3px)",
          borderRadius: "50%",
        }}
      />

      {/* Velocity glow halo */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          width: BALL_SIZE * 2.2,
          height: BALL_SIZE * 2.2,
          left: "50%",
          top: "50%",
          marginLeft: `-${BALL_SIZE * 1.1}px`,
          marginTop: `-${BALL_SIZE * 1.1}px`,
          borderRadius: "50%",
          background: isGolden
            ? "radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(234,179,8,0.1) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(148,180,255,0.22) 0%, rgba(100,140,255,0.08) 45%, transparent 70%)",
          willChange: "filter, opacity, transform",
          transition: "none",
        }}
      />

      {/* Ball sphere */}
      <div
        style={{
          position: "relative",
          width: BALL_SIZE,
          height: BALL_SIZE,
          borderRadius: "50%",
          background: isGolden
            ? `radial-gradient(circle at 32% 28%,
                #fffbeb 0%,
                #fef08a 10%,
                #fde047 24%,
                #eab308 45%,
                #a16207 70%,
                #78350f 88%,
                #3c1a06 100%)`
            : `radial-gradient(circle at 30% 26%,
                #ffffff 0%,
                #f1f5f9 10%,
                #e2e8f0 22%,
                #94a3b8 45%,
                #475569 68%,
                #1e293b 84%,
                #0f172a 100%)`,
          boxShadow: isGolden
            ? `0 3px 10px rgba(0,0,0,0.6),
               inset 0 1.5px 2px rgba(255,255,255,0.85),
               inset 0 -2px 4px rgba(0,0,0,0.7),
               0 0 12px rgba(234,179,8,0.4)`
            : `0 3px 10px rgba(0,0,0,0.6),
               inset 0 1.5px 2px rgba(255,255,255,0.85),
               inset 0 -2px 4px rgba(0,0,0,0.7),
               0 0 8px rgba(148,163,184,0.25)`,
        }}
      >
        {/* Primary specular glint */}
        <div
          style={{
            position: "absolute",
            width: 4.5,
            height: 4.5,
            top: 2.5,
            left: 3,
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 3px 1px rgba(255,255,255,0.9)",
          }}
        />

        {/* Secondary micro-glint */}
        <div
          style={{
            position: "absolute",
            width: 1.8,
            height: 1.8,
            top: 7,
            left: 3.5,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
          }}
        />

        {/* Environment horizon reflection band */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 42%, rgba(0,0,0,0.22) 50%, rgba(255,255,255,0.08) 100%)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Bottom fill-light (simulates surface bounce light) */}
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 3,
            bottom: 2.5,
            right: 3,
            borderRadius: "50%",
            background: isGolden
              ? "rgba(255,240,180,0.3)"
              : "rgba(180,200,255,0.22)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </div>
  );
});

export default BallOverlay;
