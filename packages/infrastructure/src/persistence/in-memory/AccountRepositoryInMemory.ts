import { Account } from "@monavenir/domain";
import { AccountRepository } from "@monavenir/application";

export class AccountRepositoryInMemory implements AccountRepository {
  private store = new Map<string, Account>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByOwner(ownerId: string) {
    return [...this.store.values()].filter((a) => a.ownerId === ownerId);
  }
  async save(a: Account) {
    this.store.set(a.id, a);
  }
}
