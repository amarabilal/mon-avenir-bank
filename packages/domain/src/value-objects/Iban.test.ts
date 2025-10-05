// packages/domain/src/value-objects/Iban.test.ts
import { Iban } from "./Iban";

describe("Iban (FR, mod97)", () => {
  it("accepts a known valid FR IBAN", () => {
    const iban = Iban.create("FR14 2004 1010 0505 0001 3M02 606");
    expect(iban.toString()).toBe("FR1420041010050500013M02606");
  });

  it("rejects wrong length or bad country", () => {
    expect(() => Iban.create("FR762")).toThrow();
    expect(() => Iban.create("DE68210501700012345678")).toThrow();
  });

  it("rejects invalid checksum", () => {
    expect(() => Iban.create("FR14 2004 1010 0505 0001 3M02 607")).toThrow();
  });

  it("normalizes spaces & lowercase", () => {
    const iban = Iban.create("fr14 2004 1010 0505 0001 3m02 606");
    expect(iban.toString()).toBe("FR1420041010050500013M02606");
  });
});
