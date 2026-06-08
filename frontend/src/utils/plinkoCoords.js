// plinkoCoords.js
// Responsive layout constants — bin positions precisely aligned with peg columns

export const ROWS = 12;
export const PEG_RADIUS = 5;
export const BALL_RADIUS = 9;
export const ROW_SPACING = 48; // vertical spacing between peg rows
export const COL_SPACING = 50; // horizontal spacing between pegs in a row
export const START_Y = 8; // ball spawn Y

export const PAYOUTS = [10, 5, 3, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 3, 5, 10];

/**
 * Get SVG-space position of peg at (row, col).
 * Row 0 = top (1 peg), Row 11 = bottom (12 pegs).
 */
export function getPegPosition(row, col) {
  // Center the row: each row has (row+1) pegs spaced COL_SPACING apart
  const rowOffset = (ROWS - row) * (COL_SPACING / 2) - (ROWS * COL_SPACING) / 2;
  return {
    x: rowOffset + col * COL_SPACING,
    y: row * ROW_SPACING + 26,
  };
}

/**
 * X coordinate where ball spawns for a given drop column (0–12).
 * Column 6 = center.
 */
export function getDropStartX(dropColumn) {
  return (dropColumn - 6) * COL_SPACING;
}

/**
 * Center X and landing Y for a given bin index (0–12).
 * ── CRITICAL ──
 * Bins sit BETWEEN the bottom-row pegs. The bottom row (row 11) has 12 pegs,
 * creating 13 gaps. Each bin center aligns with one of those gaps.
 *
 * Bottom row peg positions (same formula as getPegPosition with row=ROWS-1=11):
 *   rowOffset = (ROWS - 11) * (CS/2) - (ROWS * CS)/2 = 1*(25) - 300 = -275
 *   pegX(col) = -275 + col * 50
 *
 * Bin center (between peg col and peg col+1, so halfway):
 *   binCenterX(i) = -275 + (i - 0.5) * 50  for i = 0..12
 *   which simplifies to: -(ROWS*CS)/2 + i*CS
 */
export function getBinPosition(binIndex) {
  const x = -(ROWS * COL_SPACING) / 2 + binIndex * COL_SPACING;
  // Landing Y: just below bottom peg row, ball rests on bin floor
  const y = ROWS * ROW_SPACING + 30;
  return { x, y };
}

/**
 * Generate all peg objects for the board.
 */
export function generatePegs() {
  const pegs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      const { x, y } = getPegPosition(r, c);
      pegs.push({ id: `peg-${r}-${c}`, row: r, col: c, x, y });
    }
  }
  return pegs;
}

/**
 * Generate all bin objects for the board.
 *
 * bin.x  = left edge of bin rect in SVG space
 * bin.centerX = center of bin in SVG space (used for confetti origin)
 * bin.y  = top edge of bin rect
 */
export function generateBins() {
  const bins = [];
  const binH = 48;
  // Bin Y: place the bin top slightly below the last peg row
  const binTop = ROWS * ROW_SPACING + 28;
  const binW = COL_SPACING; // each bin is exactly one COL_SPACING wide

  for (let i = 0; i <= ROWS; i++) {
    // Center of this bin slot
    const cx = -(ROWS * COL_SPACING) / 2 + i * COL_SPACING;
    bins.push({
      id: `bin-${i}`,
      x: cx - binW / 2, // left edge
      y: binTop,
      centerX: cx,
      width: binW,
      height: binH,
      multiplier: PAYOUTS[i],
    });
  }
  return bins;
}
