import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { TokenPort } from "@monavenir/application";

export class JwtTokenService implements TokenPort {
  constructor(private readonly secret: Secret) {}

  async sign(
    payload: Record<string, any>,
    opts?: { expiresIn?: string },
  ): Promise<string> {
    const options: SignOptions = {};
    if (opts?.expiresIn) {
      (options as SignOptions).expiresIn =
        opts.expiresIn as unknown as SignOptions["expiresIn"];
    }
    return jwt.sign(payload, this.secret, options);
  }

  async verify<T>(token: string): Promise<T> {
    return jwt.verify(token, this.secret) as T;
  }
}
