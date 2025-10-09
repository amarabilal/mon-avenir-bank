export class PasswordHash {
  private constructor(private readonly hashed: string) {}
  static from(hashed: string): PasswordHash {
    if (!hashed || hashed.length < 20) throw new Error("Invalid password hash");
    return new PasswordHash(hashed);
  }
  toString() {
    return this.hashed;
  }
}
