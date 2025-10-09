import { AccountRepository } from "../ports";

export type DeleteAccountInput = { accountId: string; ownerId: string };

export class DeleteAccountCommand {
  constructor(private readonly accounts: AccountRepository) {}
  async execute(input: DeleteAccountInput): Promise<void> {
    const acc = await this.accounts.findById(input.accountId);
    if (!acc || acc.snapshot().ownerId !== input.ownerId)
      throw new Error("Account not found");
    await this.accounts.delete(input.accountId);
  }
}
