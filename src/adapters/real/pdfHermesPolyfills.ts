/**
 * pdf.js references browser/DOM globals — DOMMatrix, Path2D, DOMPoint — that
 * exist in Node and browsers but NOT in Hermes (React Native's engine). It
 * touches them at module-evaluation time, so importing pdfjs-dist under
 * Hermes throws "Property 'DOMMatrix' doesn't exist" and crashes the app.
 *
 * This was caught only by running on a real device (Expo Go / Hermes) — Node
 * and the web bundle both have these globals, so neither surfaced it. It's the
 * exact native/Hermes gap flagged as unverified in the PDF verification notes.
 *
 * For statement parsing we do text extraction only — never canvas/SVG
 * rendering — so these globals are referenced during module load but their
 * methods are never actually called. Minimal stub constructors are therefore
 * enough to let pdfjs-dist evaluate. Must run BEFORE pdfjs-dist is imported.
 */
export function installPdfHermesPolyfills(): void {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") {
    g.DOMMatrix = class DOMMatrix {};
  }
  if (typeof g.Path2D === "undefined") {
    g.Path2D = class Path2D {};
  }
  if (typeof g.DOMPoint === "undefined") {
    g.DOMPoint = class DOMPoint {};
  }
}
