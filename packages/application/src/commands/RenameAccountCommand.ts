import { AccountRepository } from "../ports";

export type RenameAccountInput = {
  accountId: string;
  ownerId: string;
  newName: string;
};

export class RenameAccountCommand {
  constructor(private readonly accounts: AccountRepository) {}
  async execute(input: RenameAccountInput): Promise<void> {
    const acc = await this.accounts.findById(input.accountId);
    if (!acc || acc.snapshot().ownerId !== input.ownerId)
      throw new Error("Account not found");
    acc.rename(input.newName);
    await this.accounts.save(acc);
  }
}
