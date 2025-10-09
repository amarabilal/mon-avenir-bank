import { Account } from "@monavenir/domain";

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByOwner(ownerId: string): Promise<Account[]>;
  save(account: Account): Promise<void>;
  delete(id: string): Promise<void>;
  existsByIban(iban: string): Promise<boolean>;
}
