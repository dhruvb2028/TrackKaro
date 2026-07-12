import { parseExtractionResponse, dataUri } from "./groqExtraction";

describe("parseExtractionResponse", () => {
  it("parses clean JSON with high confidence", () => {
    expect(parseExtractionResponse('{"merchant":"Swiggy","date":"2026-07-02","amount":480}')).toEqual({
      merchant: "Swiggy",
      date: "2026-07-02",
      amount: 480,
      confidence: "high",
    });
  });

  it("strips code fences", () => {
    const r = parseExtractionResponse('```json\n{"merchant":"Amazon","date":null,"amount":1299}\n```');
    expect(r.merchant).toBe("Amazon");
    expect(r.amount).toBe(1299);
  });

  it("extracts JSON embedded in prose", () => {
    const r = parseExtractionResponse('Sure: {"merchant":"Ola","date":"2026-07-04","amount":250} done');
    expect(r.amount).toBe(250);
  });

  it("parses a string amount with a currency symbol", () => {
    const r = parseExtractionResponse('{"merchant":"Cafe","date":null,"amount":"₹99.50"}');
    expect(r.amount).toBe(99.5);
  });

  it("drops a non-ISO date", () => {
    const r = parseExtractionResponse('{"merchant":"X","date":"02/07/2026","amount":10}');
    expect(r.date).toBeNull();
  });

  it("nulls an empty merchant", () => {
    const r = parseExtractionResponse('{"merchant":"  ","date":null,"amount":5}');
    expect(r.merchant).toBeNull();
  });

  it("rejects a negative amount and reports low confidence", () => {
    expect(parseExtractionResponse('{"merchant":"R","date":null,"amount":-5}')).toEqual({
      merchant: "R",
      date: null,
      amount: null,
      confidence: "low",
    });
  });

  it("returns low confidence for garbage", () => {
    expect(parseExtractionResponse("the model refused").confidence).toBe("low");
  });

  it("handles malformed JSON gracefully", () => {
    expect(parseExtractionResponse('{"merchant": "X", amount:').amount).toBeNull();
  });
});

describe("dataUri", () => {
  it("wraps base64 in a data URI", () => {
    expect(dataUri("abc")).toBe("data:image/jpeg;base64,abc");
  });
});
