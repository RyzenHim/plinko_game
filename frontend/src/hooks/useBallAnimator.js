"use client";

import { useRef, useCallback, useEffect } from "react";
import { useMotionValue } from "framer-motion";
import { buildBallTimelineFull, sampleTimeline } from "../utils/ballAnimationEngine";
import { soundService } from "../utils/sound";

/**
 * RAF-driven animator — writes MotionValues directly, zero React re-renders per frame.
 */
export function useBallAnimator({ reducedMotion = false, onFrame, onImpact, onComplete } = {}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const rotate = useMotionValue(0);
  const opacity = useMotionValue(0);
  const velocity = useMotionValue(0);

  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const timelineRef = useRef(null);
  const eventsRef = useRef([]);
  const firedEventsRef = useRef(new Set());
  const startTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  const buildEvents = (segments) => {
    const events = [];
    let time = 0;
    for (const seg of segments) {
      if (seg.type === "impact") {
        events.push({
          at: time + seg.duration * 0.35,
          type: "impact",
          x: seg.to.x,
          y: seg.to.y,
          pegId: seg.pegId,
        });
        events.push({ at: time + seg.duration * 0.9, type: "sound", sound: "tick" });
      }
      if (seg.type === "land_fall") {
        events.push({ at: time + seg.duration, type: "sound", sound: "land" });
      }
      time += seg.duration;
    }
    return events;
  };

  const cancel = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    runningRef.current = false;
    firedEventsRef.current.clear();
    frameCountRef.current = 0;
  }, []);

  const tick = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || !runningRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const sample = sampleTimeline(timeline.segments, elapsed);

    x.set(sample.x);
    y.set(sample.y);
    scaleX.set(sample.sx);
    scaleY.set(sample.sy);
    rotate.set(sample.rot);
    velocity.set(sample.velocity);

    for (const ev of eventsRef.current) {
      const key = `${ev.type}-${ev.at}-${ev.pegId || ev.sound}`;
      if (!firedEventsRef.current.has(key) && elapsed >= ev.at) {
        firedEventsRef.current.add(key);
        if (ev.type === "impact") onImpact?.(ev);
        if (ev.type === "sound") {
          if (ev.sound === "tick") soundService.playTick();
          if (ev.sound === "land") soundService.playLanding();
        }
      }
    }

    frameCountRef.current += 1;
    onFrame?.(sample, elapsed, frameCountRef.current);

    if (elapsed < timeline.totalDuration) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      runningRef.current = false;
      onComplete?.();
    }
  }, [x, y, scaleX, scaleY, rotate, velocity, onFrame, onImpact, onComplete]);

  const start = useCallback(
    (path, dropColumn, binIndex) => {
      cancel();
      const timeline = buildBallTimelineFull(path, dropColumn, binIndex, { reducedMotion });
      timelineRef.current = timeline;
      eventsRef.current = buildEvents(timeline.segments);

      const first = timeline.segments[0]?.from ?? { x: 0, y: 0, sx: 1, sy: 1, rot: 0 };
      x.set(first.x);
      y.set(first.y);
      scaleX.set(first.sx ?? 1);
      scaleY.set(first.sy ?? 1);
      rotate.set(first.rot ?? 0);
      opacity.set(1);
      velocity.set(0);

      startTimeRef.current = performance.now();
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    },
    [cancel, reducedMotion, x, y, scaleX, scaleY, rotate, opacity, velocity, tick]
  );

  const reset = useCallback(
    (startX, startY) => {
      cancel();
      x.set(startX);
      y.set(startY);
      scaleX.set(1);
      scaleY.set(1);
      rotate.set(0);
      opacity.set(0);
      velocity.set(0);
    },
    [cancel, x, y, scaleX, scaleY, rotate, opacity, velocity]
  );

  useEffect(() => cancel, [cancel]);

  return { x, y, scaleX, scaleY, rotate, opacity, velocity, start, reset, cancel };
}
