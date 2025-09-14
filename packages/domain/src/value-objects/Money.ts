export class Money {
  private constructor(
    public readonly cents: number,
    public readonly currency: string = "EUR",
  ) {}
  static fromEuros(euros: number) {
    return new Money(Math.round(euros * 100));
  }
  add(other: Money) {
    this.ensureCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }
  sub(other: Money) {
    this.ensureCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }
  private ensureCurrency(other: Money) {
    if (other.currency !== this.currency) throw new Error("Currency mismatch");
  }
}
