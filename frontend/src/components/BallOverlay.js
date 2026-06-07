"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

const VIEWBOX = { x: -300, y: 0, w: 600, h: 680 };

/**
 * Imperative ball layer — translate3d only, updated from RAF (no React re-renders).
 */
const BallOverlay = forwardRef(function BallOverlay({ isGolden = false, containerRef }, ref) {
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
        const blur = Math.min(6, 2 + velocity * 0.06);
        glowRef.current.style.filter = `blur(${blur}px)`;
        glowRef.current.style.opacity = String(Math.min(0.9, 0.4 + velocity * 0.03));
      }
    },
    hide() {
      if (rootRef.current) rootRef.current.style.opacity = "0";
    },
  }));

  return (
    <div
      ref={rootRef}
      className="absolute top-0 left-0 z-20 pointer-events-none"
      style={{ willChange: "transform, opacity", opacity: 0 }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 6,
          left: "50%",
          top: "100%",
          marginLeft: -9,
          marginTop: 5,
          background: "rgba(0,0,0,0.5)",
          filter: "blur(4px)",
        }}
      />
      <div
        ref={glowRef}
        className="absolute rounded-full"
        style={{
          width: 24,
          height: 24,
          left: "50%",
          top: "50%",
          marginLeft: -12,
          marginTop: -12,
          background: isGolden
            ? "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(226,232,240,0.10) 0%, transparent 70%)",
          willChange: "filter, opacity",
        }}
      />
      <div
        className="relative rounded-full"
        style={{
          width: 18,
          height: 18,
          background: isGolden
            ? "radial-gradient(circle at 30% 30%, #fffbeb 0%, #fef08a 12%, #eab308 35%, #a16207 65%, #451a03 100%)"
            : "radial-gradient(circle at 30% 30%, #ffffff 0%, #f1f5f9 12%, #cbd5e1 28%, #64748b 55%, #1e293b 80%, #0f172a 100%)",
          boxShadow: isGolden
            ? "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.6)"
            : "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.6)",
        }}
      >
        {/* Specular Highlight Glint */}
        <div
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            top: 2,
            left: 2.5,
            background: "#ffffff",
            boxShadow: "0 0 2px 0.5px rgba(255,255,255,0.8)",
          }}
        />
        {/* Environment Horizon Line Reflection */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 45%, rgba(0,0,0,0.25) 50%, rgba(255,255,255,0.1) 100%)",
            mixBlendMode: "overlay",
          }}
        />
        {/* Bottom Bounce Light Reflection */}
        <div
          className="absolute rounded-full"
          style={{
            width: 5,
            height: 2.5,
            bottom: 2,
            right: 3,
            background: "rgba(255,255,255,0.25)",
            filter: "blur(0.5px)",
          }}
        />
      </div>
    </div>
  );
});

export default BallOverlay;
