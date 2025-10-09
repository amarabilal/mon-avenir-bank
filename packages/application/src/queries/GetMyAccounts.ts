import { AccountRepository } from "../ports";

export type GetMyAccountsInput = { ownerId: string };
export type GetMyAccountsOutput = Array<{
  id: string;
  name: string;
  iban: string | null;
  balance: number;
}>;

export class GetMyAccountsQuery {
  constructor(private readonly accounts: AccountRepository) {}
  async execute(input: GetMyAccountsInput): Promise<GetMyAccountsOutput> {
    const list = await this.accounts.findByOwner(input.ownerId);
    return list.map((a) => {
      const s = a.snapshot();
      return { id: s.id, name: s.name, iban: s.iban, balance: s.balance };
    });
  }
}
