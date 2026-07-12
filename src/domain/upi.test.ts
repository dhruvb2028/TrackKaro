import { buildUpiUri, isValidVpa } from "./upi";

describe("buildUpiUri", () => {
  it("builds a well-formed deep link with all fields", () => {
    const uri = buildUpiUri({ vpa: "rahul@okhdfc", payeeName: "Rahul", amount: 450, note: "dinner" });
    expect(uri).toContain("upi://pay?");
    expect(uri).toContain("pa=rahul%40okhdfc");
    expect(uri).toContain("pn=Rahul");
    expect(uri).toContain("am=450.00");
    expect(uri).toContain("cu=INR");
    expect(uri).toContain("tn=dinner");
  });

  it("omits the note when not provided", () => {
    const uri = buildUpiUri({ vpa: "swiggy@icici", payeeName: "Swiggy", amount: 299.5 });
    expect(uri).toContain("am=299.50");
    expect(uri).not.toContain("tn=");
  });
});

describe("isValidVpa", () => {
  it.each(["rahul@okhdfc", "9876543210@paytm", "some.name-1@ybl"])(
    "accepts %s",
    (vpa) => expect(isValidVpa(vpa)).toBe(true)
  );

  it.each(["rahul", "a@b@c", "  ", "@okhdfc", "name@"])(
    "rejects %s",
    (vpa) => expect(isValidVpa(vpa)).toBe(false)
  );
});
