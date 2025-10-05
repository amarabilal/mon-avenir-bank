// IBAN FR: 27 chars total: "FR" + 25 alphanum. Checksum mod97 === 1.
export class Iban {
  private constructor(private readonly value: string) {}

  static create(input: string): Iban {
    const normalized = Iban.normalize(input);
    if (!/^FR[0-9A-Z]{25}$/.test(normalized)) {
      throw new Error("Invalid IBAN format for FR");
    }
    if (!Iban.mod97Valid(normalized)) {
      throw new Error("Invalid IBAN checksum");
    }
    return new Iban(normalized);
  }

  toString() {
    return this.value;
  }

  private static normalize(s: string) {
    return s.replace(/\s+/g, "").toUpperCase();
  }

  private static mod97Valid(iban: string) {
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for (const ch of rearranged) {
      const v = /[A-Z]/.test(ch)
        ? ch.charCodeAt(0) - 55 /* A=10 */
        : Number(ch);
      const str = String(v);
      for (const digit of str) {
        remainder = (remainder * 10 + Number(digit)) % 97;
      }
    }
    return remainder === 1;
  }
}
