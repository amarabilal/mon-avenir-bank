import type { Account } from "@monavenir/domain";
export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByOwner(ownerId: string): Promise<Account[]>;
  save(account: Account): Promise<void>;
}
export interface Clock {
  now(): Date;
}
export interface Uuid {
  v4(): string;
}
