export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

/**
 * PDF text extraction gives a flat bag of positioned words, not rows and
 * columns — a bank statement's table structure only exists visually. This
 * reconstructs it: group words into lines by y-coordinate, then split each
 * line into cells wherever the horizontal gap between words is wide enough
 * to be a column boundary rather than a space within one column's text.
 *
 * The result is deliberately the same string[][] shape CSV rows use, so it
 * can go straight through the same detectColumns/rowsToTransactions logic
 * (src/domain/statementCsv.ts) — no separate PDF-specific column parser.
 */
export function reconstructRows(items: PdfTextItem[], columnGapThreshold = 10): string[][] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: PdfTextItem[][] = [];
  const Y_TOLERANCE = 2;
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= Y_TOLERANCE);
    if (line) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines.map((line) => {
    const sortedLine = [...line].sort((a, b) => a.x - b.x);
    const cells: string[] = [];
    let current = sortedLine[0].str;
    let prevEndX = sortedLine[0].x + estimateWidth(sortedLine[0].str);

    for (let i = 1; i < sortedLine.length; i++) {
      const item = sortedLine[i];
      const gap = item.x - prevEndX;
      if (gap > columnGapThreshold) {
        cells.push(current.trim());
        current = item.str;
      } else {
        current += (gap > 1 ? " " : "") + item.str;
      }
      prevEndX = item.x + estimateWidth(item.str);
    }
    cells.push(current.trim());
    return cells;
  });
}

/** Rough width estimate (no font metrics available from plain text items). */
function estimateWidth(str: string): number {
  return str.length * 5;
}
