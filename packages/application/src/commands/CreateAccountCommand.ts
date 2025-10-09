import {
  AccountRepository,
  IdGeneratorPort,
  IbanGeneratorPort,
} from "../ports";
import { Account, Money, Iban } from "@monavenir/domain";

export type CreateAccountInput = { ownerId: string; name?: string };
export type CreateAccountOutput = { accountId: string; iban: string };

export class CreateAccountCommand {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly ids: IdGeneratorPort,
    private readonly ibans: IbanGeneratorPort,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const acc = new Account(
      this.ids.next(),
      input.name?.trim() || "Compte secondaire",
      input.ownerId,
      Money.fromEuros(0),
    );
    while (true) {
      const ibanStr = await this.ibans.generate();
      if (!(await this.accounts.existsByIban(ibanStr))) {
        acc.linkIban(Iban.create(ibanStr));
        break;
      }
    }
    await this.accounts.save(acc);
    return { accountId: acc.snapshot().id, iban: acc.snapshot().iban! };
  }
}
