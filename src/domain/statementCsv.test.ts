import { parseCsv, detectColumns, rowsToTransactions } from "./statementCsv";

describe("parseCsv", () => {
  it("splits plain unquoted rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    expect(parseCsv('Date,Narration,Amount\n01/07/2026,"UPI, Swiggy, food",480')).toEqual([
      ["Date", "Narration", "Amount"],
      ["01/07/2026", "UPI, Swiggy, food", "480"],
    ]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    expect(parseCsv('a,b\n1,"He said ""hi"""')).toEqual([
      ["a", "b"],
      ["1", 'He said "hi"'],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("skips fully blank trailing lines", () => {
    expect(parseCsv("a,b\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("detectColumns", () => {
  it("recognizes an HDFC-style debit/credit statement", () => {
    const rows = parseCsv(
      "Date,Narration,Chq/Ref No,Debit Amount,Credit Amount\n01/07/2026,SWIGGY BANGALORE,406712345678,480,"
    );
    const result = detectColumns(rows);
    expect(result).not.toBeNull();
    expect(result!.headerRowIndex).toBe(0);
  });

  it("recognizes a UPI-app-style combined amount+type export", () => {
    const rows = parseCsv("Transaction Date,Description,Amount,Type\n02/07/2026,Amazon,1299,Debit");
    const result = detectColumns(rows);
    expect(result).not.toBeNull();
  });

  it("returns null when there's no plausible date+narration+amount header", () => {
    const rows = parseCsv("Foo,Bar,Baz\n1,2,3");
    expect(detectColumns(rows)).toBeNull();
  });

  it("finds the header row even if preceded by a title row", () => {
    const rows = parseCsv(
      "Statement for account 1234\nDate,Narration,Debit Amount,Credit Amount\n01/07/2026,Test,100,"
    );
    const result = detectColumns(rows);
    expect(result).not.toBeNull();
    expect(result!.headerRowIndex).toBe(1);
  });
});

describe("rowsToTransactions", () => {
  it("extracts only debit rows from a debit/credit-column statement", () => {
    const rows = parseCsv(
      [
        "Date,Narration,Chq/Ref No,Debit Amount,Credit Amount",
        "01/07/2026,SWIGGY BANGALORE,406712345678,480,",
        "02/07/2026,SALARY CREDIT,N778812,,50000",
        "03/07/2026,AMAZON,P442156,1299,",
      ].join("\n")
    );
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);

    expect(txs).toHaveLength(2);
    expect(txs[0]).toEqual({
      date: "2026-07-01",
      amount: 480,
      narration: "SWIGGY BANGALORE",
      referenceNumber: "406712345678",
    });
    expect(txs[1].narration).toBe("AMAZON");
  });

  it("extracts only Debit/Sent rows from a combined amount+type statement", () => {
    const rows = parseCsv(
      [
        "Date,Description,Amount,Type",
        "01/07/2026,Swiggy,480,Debit",
        "02/07/2026,Refund,100,Credit",
        "03/07/2026,Rahul,2000,Sent",
      ].join("\n")
    );
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);

    expect(txs).toHaveLength(2);
    expect(txs.map((t) => t.amount)).toEqual([480, 2000]);
  });

  it("parses ₹ symbols and thousands separators in amounts", () => {
    const rows = parseCsv('Date,Narration,Debit Amount,Credit Amount\n01/07/2026,Big purchase,"₹12,900",');
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);
    expect(txs[0].amount).toBe(12900);
  });

  it("normalizes DD-MM-YYYY and passes through ISO dates unchanged", () => {
    const rows = parseCsv(
      ["Date,Narration,Debit Amount,Credit Amount", "05-07-2026,A,100,", "2026-07-06,B,200,"].join("\n")
    );
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);
    expect(txs.map((t) => t.date)).toEqual(["2026-07-05", "2026-07-06"]);
  });

  it("skips rows with an unparseable date or missing amount", () => {
    const rows = parseCsv(
      [
        "Date,Narration,Debit Amount,Credit Amount",
        "not-a-date,Test,100,",
        "07/07/2026,No amount,,",
        "08/07/2026,Valid,50,",
      ].join("\n")
    );
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);
    expect(txs).toHaveLength(1);
    expect(txs[0].narration).toBe("Valid");
  });

  it("skips fully blank rows without throwing", () => {
    const rows = parseCsv(
      ["Date,Narration,Debit Amount,Credit Amount", "01/07/2026,A,100,", ",,,", "02/07/2026,B,200,"].join("\n")
    );
    const detected = detectColumns(rows)!;
    const txs = rowsToTransactions(rows, detected.headerRowIndex, detected.columns);
    expect(txs).toHaveLength(2);
  });
});
