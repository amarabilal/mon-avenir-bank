import { HasherPort } from "@monavenir/application";
import bcrypt from "bcryptjs";

export class BcryptHasher implements HasherPort {
  async hash(plain: string) {
    return bcrypt.hash(plain, 10);
  }
  async verify(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }
}
