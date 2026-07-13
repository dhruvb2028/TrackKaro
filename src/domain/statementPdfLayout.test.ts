import { reconstructRows, PdfTextItem } from "./statementPdfLayout";

// pdf.js text items are individual words/fragments with a baseline (x, y)
// position — this simulates what getTextContent() would hand back for a
// two-row table: a header line and one data line, three columns each.
function row(y: number, cells: { x: number; str: string }[]): PdfTextItem[] {
  return cells.map((c) => ({ str: c.str, x: c.x, y }));
}

describe("reconstructRows", () => {
  it("groups words on the same baseline into one row, split into columns", () => {
    const items: PdfTextItem[] = [
      ...row(100, [
        { x: 20, str: "Date" },
        { x: 100, str: "Narration" },
        { x: 250, str: "Debit" },
      ]),
      ...row(80, [
        { x: 20, str: "05/07/2026" },
        { x: 100, str: "NEFT/HDFC/EMI" },
        { x: 250, str: "5000.00" },
      ]),
    ];

    const rows = reconstructRows(items);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(["Date", "Narration", "Debit"]);
    expect(rows[1]).toEqual(["05/07/2026", "NEFT/HDFC/EMI", "5000.00"]);
  });

  it("merges adjacent words within the same column using a space", () => {
    // "EMI" and "HOME" and "LOAN" sit close together — same column, one cell.
    const items: PdfTextItem[] = [
      { str: "EMI", x: 100, y: 50 },
      { str: "HOME", x: 118, y: 50 },
      { str: "LOAN", x: 145, y: 50 },
      { str: "5000", x: 250, y: 50 },
    ];
    const rows = reconstructRows(items);
    expect(rows).toEqual([["EMI HOME LOAN", "5000"]]);
  });

  it("orders rows top-to-bottom by y, ignoring input order", () => {
    const items: PdfTextItem[] = [
      { str: "bottom", x: 20, y: 10 },
      { str: "top", x: 20, y: 100 },
      { str: "middle", x: 20, y: 55 },
    ];
    const rows = reconstructRows(items);
    expect(rows.map((r) => r[0])).toEqual(["top", "middle", "bottom"]);
  });

  it("returns an empty array for no items", () => {
    expect(reconstructRows([])).toEqual([]);
  });

  it("tolerates tiny y jitter within the same visual line", () => {
    const items: PdfTextItem[] = [
      { str: "A", x: 20, y: 100.0 },
      { str: "B", x: 100, y: 100.6 }, // sub-pixel baseline noise, same line
    ];
    const rows = reconstructRows(items);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["A", "B"]);
  });
});
