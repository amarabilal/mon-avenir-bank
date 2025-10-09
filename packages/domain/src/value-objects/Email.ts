export class Email {
  private constructor(private readonly value: string) {}
  static create(raw: string): Email {
    const v = raw.trim().toLowerCase();
    // Simple mais robuste pour notre scope
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error("Invalid email");
    return new Email(v);
  }
  toString() {
    return this.value;
  }
}
