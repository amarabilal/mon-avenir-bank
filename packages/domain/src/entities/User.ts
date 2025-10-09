import { Email } from "../value-objects/Email";
import { PasswordHash } from "../value-objects/PasswordHash";

export class User {
  private confirmedAt: Date | null;

  constructor(
    public readonly id: string,
    private email: Email,
    private passwordHash: PasswordHash,
    private confirmationToken: string,
    confirmedAt?: Date | null,
  ) {
    this.confirmedAt = confirmedAt ?? null;
  }

  snapshot() {
    return {
      id: this.id,
      email: this.email.toString(),
      passwordHash: this.passwordHash.toString(),
      confirmationToken: this.confirmationToken,
      confirmedAt: this.confirmedAt ? new Date(this.confirmedAt) : null,
    };
  }

  confirm(token: string) {
    if (this.confirmedAt) return; // idempotent
    if (token !== this.confirmationToken)
      throw new Error("Invalid confirmation token");
    this.confirmedAt = new Date();
  }

  isConfirmed() {
    return !!this.confirmedAt;
  }
  getEmail() {
    return this.email;
  }
  getPasswordHash() {
    return this.passwordHash;
  }
}
