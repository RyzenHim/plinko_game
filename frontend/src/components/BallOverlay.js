"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

const VIEWBOX = { x: -300, y: 0, w: 600, h: 680 };

/**
 * Imperative DOM ball — zero React re-renders during animation.
 * Pure translate3d + inline style mutations only.
 */
const BallOverlay = forwardRef(function BallOverlay(
  { isGolden = false, containerRef },
  ref,
) {
  const rootRef = useRef(null);
  const glowRef = useRef(null);
  const shadowRef = useRef(null);
  const sizeRef = useRef({ w: 1, h: 1 });

  // Track container size for SVG→pixel mapping
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const sync = () => {
      const r = el.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const toPixel = (svgX, svgY) => {
    const { w, h } = sizeRef.current;
    return {
      px: ((svgX - VIEWBOX.x) / VIEWBOX.w) * w,
      py: (svgY / VIEWBOX.h) * h,
    };
  };

  useImperativeHandle(ref, () => ({
    update({ x, y, sx = 1, sy = 1, rot = 0, velocity = 0, visible = true }) {
      const el = rootRef.current;
      if (!el) return;

      const { px, py } = toPixel(x, y);
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translate3d(${px}px,${py}px,0) translate(-50%,-50%) scale3d(${sx},${sy},1) rotate(${rot}deg)`;

      // Velocity-driven glow halo
      if (glowRef.current) {
        const v = Math.min(velocity, 30);
        const scale = 1 + v * 0.022;
        const blur = 2.5 + v * 0.09;
        const opacity = 0.3 + v * 0.022;
        glowRef.current.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;
        glowRef.current.style.filter = `blur(${blur.toFixed(1)}px)`;
        glowRef.current.style.opacity = Math.min(0.88, opacity).toFixed(3);
      }

      // Contact shadow shrinks as ball rises
      if (shadowRef.current) {
        const { h } = sizeRef.current;
        const floorPy = ((VIEWBOX.h * 0.88) / VIEWBOX.h) * h;
        const dist = Math.max(0, floorPy - py);
        const shadowW = Math.max(4, 18 - dist * 0.04);
        const shadowH = Math.max(1.5, 4 - dist * 0.012);
        const shadowO = Math.max(0, 0.35 - dist * 0.001);
        shadowRef.current.style.width = `${shadowW}px`;
        shadowRef.current.style.height = `${shadowH}px`;
        shadowRef.current.style.opacity = shadowO.toFixed(3);
      }
    },
    hide() {
      if (rootRef.current) rootRef.current.style.opacity = "0";
    },
  }));

  const SIZE = 18; // ball diameter px

  const chrome = isGolden
    ? `radial-gradient(circle at 31% 27%,
        #fffbeb 0%, #fef08a 10%, #fde047 22%,
        #eab308 44%, #a16207 68%, #78350f 86%, #3c1a06 100%)`
    : `radial-gradient(circle at 30% 26%,
        #ffffff 0%, #f0f4ff 9%, #dce6f5 20%,
        #8fa4cc 44%, #3d5280 68%, #1a2d50 85%, #0a1628 100%)`;

  const glowColor = isGolden
    ? "radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(234,179,8,0.15) 45%, transparent 70%)"
    : "radial-gradient(circle, rgba(148,180,255,0.3) 0%, rgba(100,140,255,0.10) 45%, transparent 70%)";

  const boxShadow = isGolden
    ? `0 3px 12px rgba(0,0,0,0.6),
       inset 0 1.5px 2.5px rgba(255,255,255,0.88),
       inset 0 -2px 5px rgba(0,0,0,0.72),
       0 0 14px rgba(234,179,8,0.45)`
    : `0 3px 12px rgba(0,0,0,0.62),
       inset 0 1.5px 2.5px rgba(255,255,255,0.88),
       inset 0 -2px 5px rgba(0,0,0,0.72),
       0 0 10px rgba(148,163,184,0.22)`;

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 20,
        pointerEvents: "none",
        willChange: "transform, opacity",
        opacity: 0,
      }}
    >
      {/* Contact shadow (floor) */}
      <div
        ref={shadowRef}
        style={{
          position: "absolute",
          left: "50%",
          top: `calc(100% + 5px)`,
          transform: "translateX(-50%)",
          width: SIZE,
          height: 4,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)",
          filter: "blur(3px)",
        }}
      />

      {/* Velocity glow halo */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: SIZE * 2.6,
          height: SIZE * 2.6,
          borderRadius: "50%",
          background: glowColor,
          opacity: 0.3,
          willChange: "filter, opacity, transform",
        }}
      />

      {/* Ball sphere */}
      <div
        style={{
          position: "relative",
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          background: chrome,
          boxShadow,
        }}
      >
        {/* Primary specular */}
        <div
          style={{
            position: "absolute",
            width: 5,
            height: 5,
            top: 2.5,
            left: 3,
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 4px 1.5px rgba(255,255,255,0.85)",
          }}
        />

        {/* Secondary micro glint */}
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 2,
            top: 7,
            left: 3.5,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.65)",
          }}
        />

        {/* Environment horizon band */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%, rgba(0,0,0,0.25) 52%, rgba(255,255,255,0.1) 100%)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Bottom fill light */}
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 3,
            bottom: 2.5,
            right: 3,
            borderRadius: "50%",
            background: isGolden
              ? "rgba(255,240,160,0.35)"
              : "rgba(180,210,255,0.25)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </div>
  );
});

export default BallOverlay;
