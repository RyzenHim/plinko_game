// plinkoCoords.js — board layout constants and position helpers

export const ROWS = 12;
export const PEG_RADIUS = 5;
export const BALL_RADIUS = 9;
export const ROW_SPACING = 48;
export const COL_SPACING = 50;
export const START_Y = 8;

export const PAYOUTS = [10, 5, 3, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 3, 5, 10];

export function getPegPosition(row, col) {
  const rowOffset = (ROWS - row) * (COL_SPACING / 2) - (ROWS * COL_SPACING) / 2;
  return {
    x: rowOffset + col * COL_SPACING,
    y: row * ROW_SPACING + 26,
  };
}

export function getDropStartX(dropColumn) {
  return (dropColumn - 6) * COL_SPACING;
}

export function getBinPosition(binIndex) {
  const x = -((ROWS * COL_SPACING) / 2) + binIndex * COL_SPACING;
  const y = ROWS * ROW_SPACING + 33;
  return { x, y };
}

export function generatePegs() {
  const pegs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      const pos = getPegPosition(r, c);
      pegs.push({ id: `peg-${r}-${c}`, row: r, col: c, ...pos });
    }
  }
  return pegs;
}

export function generateBins() {
  const binY = ROWS * ROW_SPACING + 30;
  const binWidth = COL_SPACING;
  const bins = [];
  for (let i = 0; i <= ROWS; i++) {
    const x = -((ROWS * COL_SPACING) / 2) + i * COL_SPACING;
    bins.push({
      id: `bin-${i}`,
      x: x - binWidth / 2,
      y: binY,
      centerX: x,
      multiplier: PAYOUTS[i],
    });
  }
  return bins;
}
