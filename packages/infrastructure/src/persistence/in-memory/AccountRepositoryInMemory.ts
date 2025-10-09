import { AccountRepository } from "@monavenir/application";
import { Account } from "@monavenir/domain";

export class AccountRepositoryInMemory implements AccountRepository {
  private store = new Map<string, Account>();

  async findById(id: string): Promise<Account | null> {
    return this.store.get(id) ?? null;
  }
  async findByOwner(ownerId: string): Promise<Account[]> {
    return Array.from(this.store.values()).filter(
      (a) => a.snapshot().ownerId === ownerId && !a.deletedAt,
    );
  }
  async save(account: Account): Promise<void> {
    this.store.set(account.snapshot().id, account);
  }
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
  async existsByIban(iban: string): Promise<boolean> {
    for (const a of this.store.values())
      if (a.snapshot().iban === iban) return true;
    return false;
  }
}
