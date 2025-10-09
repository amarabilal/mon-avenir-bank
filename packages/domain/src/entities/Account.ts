import { Money } from "../value-objects/Money";
import { Iban } from "../value-objects/Iban";

export class Account {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly ownerId: string,
    private _balance: Money = Money.fromEuros(0),
    private _iban: Iban | null = null,
    private _deletedAt: Date | null = null,
  ) {}

  get balance(): Money {
    return this._balance;
  }
  get iban(): Iban | null {
    return this._iban;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  credit(amount: Money) {
    this._balance = this._balance.add(amount);
  }
  debit(amount: Money) {
    this._balance = this._balance.sub(amount);
  }

  linkIban(iban: Iban) {
    if (this._iban) throw new Error("IBAN already linked");
    this._iban = iban;
  }

  rename(newName: string) {
    const n = newName?.trim();
    if (!n || n.length < 2) throw new Error("Invalid account name");
    this.name = n;
  }

  delete() {
    if (this._deletedAt) return;
    this._deletedAt = new Date();
  }

  snapshot() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      name: this.name,
      iban: this._iban?.toString() ?? null,
      // Money n'a pas fromCents/toCents : exposons en euros (float) pour l'API
      balance: this._balance.cents / 100,
      deletedAt: this._deletedAt ? new Date(this._deletedAt) : null,
    };
  }
}
