import { User } from "@monavenir/domain";
import { UserRepository } from "@monavenir/application";

export class UserRepositoryInMemory implements UserRepository {
  private store = new Map<string, User>();
  async findByEmail(email: string): Promise<User | null> {
    for (const u of this.store.values())
      if (u.snapshot().email === email) return u;
    return null;
  }
  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }
  async save(user: User): Promise<void> {
    this.store.set(user.snapshot().id, user);
  }
}
