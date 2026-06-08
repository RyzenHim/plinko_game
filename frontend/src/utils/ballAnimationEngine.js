// ballTimeline.js — physics-based animation timeline builder

import {
  PEG_RADIUS,
  BALL_RADIUS,
  START_Y,
  getDropStartX,
  getPegPosition,
  getBinPosition,
} from "./plinkoCoords";

export const COLLISION_GAP = 1.5;
export const CONTACT_DIST = PEG_RADIUS + BALL_RADIUS + COLLISION_GAP;

const EASE = {
  fall: (t) => t * t,
  impact: (t) => 1 - Math.pow(1 - t, 3),
  rebound: (t) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  arc: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  land: (t) => 1 - Math.pow(1 - t, 2.5),
  settle: (t) => 1 - Math.exp(-6 * t),
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpPt(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function getContactPoint(from, peg) {
  const dx = from.x - peg.x;
  const dy = from.y - peg.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: peg.x + (dx / len) * CONTACT_DIST,
    y: peg.y + (dy / len) * CONTACT_DIST,
  };
}

function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
}

function pushSegment(segments, from, to, duration, ease, meta = {}) {
  if (duration <= 0) return;
  segments.push({ from: { ...from }, to: { ...to }, duration, ease, ...meta });
}

function state(x, y, sx = 1, sy = 1, rot = 0) {
  return { x, y, sx, sy, rot };
}

export function buildBallTimelineFull(
  path,
  dropColumn,
  binIndex,
  { reducedMotion = false } = {},
) {
  const speed = reducedMotion ? 0.35 : 1;
  const segments = [];
  let pos = state(getDropStartX(dropColumn), START_Y);

  if (path.length > 0) {
    const firstPeg = getPegPosition(path[0].row, path[0].pegIndex);
    const firstContact = getContactPoint(pos, firstPeg);
    pushSegment(
      segments,
      { ...pos, sx: 1, sy: 1, rot: 0 },
      {
        ...firstContact,
        sy: 1.02,
        sx: 0.98,
        rot: (firstContact.x - pos.x) * 0.08,
      },
      0.2 * speed,
      EASE.fall,
      { type: "fall" },
    );
    pos = state(
      firstContact.x,
      firstContact.y,
      0.98,
      1.02,
      (firstContact.x - pos.x) * 0.08,
    );
  }

  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    const peg = getPegPosition(step.row, step.pegIndex);
    const contact = getContactPoint(pos, peg);
    const exitDir = step.move === "RIGHT" ? 1 : -1;

    const compressedState = {
      ...contact,
      sx: 1.03,
      sy: 0.97,
      rot: exitDir * 4,
    };
    pushSegment(
      segments,
      { ...contact, sx: 1, sy: 1, rot: 0 },
      compressedState,
      0.04 * speed,
      EASE.impact,
      {
        type: "impact",
        pegId: `peg-${step.row}-${step.pegIndex}`,
        spark: true,
        sound: "tick",
      },
    );

    const nextStep = path[i + 1];
    if (nextStep) {
      const nextPeg = getPegPosition(nextStep.row, nextStep.pegIndex);
      const nextContact = getContactPoint(contact, nextPeg);
      const p0 = contact;
      const p1 = { x: contact.x + exitDir * 10, y: contact.y - 12 };
      const p2 = { x: nextContact.x - exitDir * 2, y: nextContact.y - 16 };
      const p3 = nextContact;
      pushSegment(
        segments,
        compressedState,
        { ...nextContact, sx: 1, sy: 1, rot: 0 },
        0.28 * speed,
        (t) => t,
        { type: "arc", isBezier: true, p0, p1, p2, p3 },
      );
      pos = state(nextContact.x, nextContact.y, 1, 1, 0);
    } else {
      const binPos = getBinPosition(binIndex);
      const floorY = binPos.y + 2;
      const landApproach = {
        x: binPos.x,
        y: floorY - BALL_RADIUS - 2,
        sx: 1,
        sy: 1,
        rot: 0,
      };
      const p0 = contact;
      const p1 = { x: contact.x + exitDir * 12, y: contact.y - 15 };
      const p2 = { x: landApproach.x, y: landApproach.y - 35 };
      const p3 = landApproach;
      pushSegment(
        segments,
        compressedState,
        landApproach,
        0.32 * speed,
        (t) => t,
        { type: "land_fall", isBezier: true, p0, p1, p2, p3, sound: "land" },
      );
      pos = state(landApproach.x, landApproach.y, 1, 1, 0);
    }
  }

  const binPos = getBinPosition(binIndex);
  const floorY = binPos.y + 2;

  // Landing sequence — 3-phase realistic settle
  const landImpact = { x: binPos.x, y: floorY, sx: 1.04, sy: 0.96, rot: 0 };
  const bounce1 = { x: binPos.x, y: floorY - 11, sx: 0.96, sy: 1.04, rot: 0 };
  const landImpact2 = { x: binPos.x, y: floorY, sx: 1.02, sy: 0.98, rot: 0 };
  const bounce2 = { x: binPos.x, y: floorY - 4, sx: 0.99, sy: 1.01, rot: 0 };
  const settle = { x: binPos.x, y: floorY + 2, sx: 1, sy: 1, rot: 0 };

  pushSegment(segments, { ...pos }, landImpact, 0.05 * speed, EASE.impact, {
    type: "land_impact",
  });
  pushSegment(segments, landImpact, bounce1, 0.08 * speed, EASE.rebound, {
    type: "land_bounce1",
  });
  pushSegment(segments, bounce1, landImpact2, 0.07 * speed, EASE.fall, {
    type: "land_impact2",
  });
  pushSegment(segments, landImpact2, bounce2, 0.06 * speed, EASE.rebound, {
    type: "land_bounce2",
  });
  pushSegment(segments, bounce2, settle, 0.1 * speed, EASE.settle, {
    type: "land_settle",
  });

  const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
  return { segments, totalDuration };
}

export function sampleTimeline(segments, elapsed) {
  let time = 0;

  for (const seg of segments) {
    const end = time + seg.duration;
    if (elapsed <= end) {
      const raw = seg.duration > 0 ? (elapsed - time) / seg.duration : 1;
      const t = seg.ease(Math.min(1, Math.max(0, raw)));

      let x,
        y,
        velocity = 0;
      if (seg.isBezier) {
        const pt = cubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, t);
        x = pt.x;
        y = pt.y;
        const tPrev = Math.max(0, t - 0.02);
        const ptPrev = cubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, tPrev);
        const fd = Math.hypot(pt.x - ptPrev.x, pt.y - ptPrev.y);
        velocity = (fd / (0.02 * seg.duration)) * 0.15;
      } else {
        x = lerp(seg.from.x, seg.to.x, t);
        y = lerp(seg.from.y, seg.to.y, t);
        const dist = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
        velocity =
          seg.duration > 0
            ? (dist / seg.duration) * (1 - Math.abs(0.5 - t) * 0.5)
            : 0;
      }

      return {
        x,
        y,
        sx: lerp(seg.from.sx ?? 1, seg.to.sx ?? 1, t),
        sy: lerp(seg.from.sy ?? 1, seg.to.sy ?? 1, t),
        rot: lerp(seg.from.rot ?? 0, seg.to.rot ?? 0, t),
        segment: seg,
        progress: t,
        velocity: Math.max(0, velocity),
      };
    }
    time = end;
  }

  const last = segments[segments.length - 1]?.to ?? {
    x: 0,
    y: 0,
    sx: 1,
    sy: 1,
    rot: 0,
  };
  return {
    ...last,
    sx: last.sx ?? 1,
    sy: last.sy ?? 1,
    rot: last.rot ?? 0,
    segment: null,
    progress: 1,
    velocity: 0,
  };
}
