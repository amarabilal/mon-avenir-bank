import { Money } from "../value-objects/Money";
export class Account {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly ownerId: string,
    private _balance: Money = Money.fromEuros(0),
  ) {}
  get balance(): Money {
    return this._balance;
  }
  credit(amount: Money) {
    this._balance = this._balance.add(amount);
  }
  debit(amount: Money) {
    if (this._balance.cents < amount.cents)
      throw new Error("Solde insuffisant");
    this._balance = this._balance.sub(amount);
  }
}
