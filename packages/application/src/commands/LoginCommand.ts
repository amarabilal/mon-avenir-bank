import { UserRepository, HasherPort, TokenPort } from "../ports";

export type LoginInput = { email: string; password: string };
export type LoginOutput = { accessToken: string; refreshToken: string };

export class LoginCommand {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: HasherPort,
    private readonly tokens: TokenPort,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) throw new Error("Invalid credentials");
    if (!user.isConfirmed()) throw new Error("Account not confirmed");

    const ok = await this.hasher.verify(
      input.password,
      user.getPasswordHash().toString(),
    );
    if (!ok) throw new Error("Invalid credentials");

    const payload = { sub: user.snapshot().id, email: user.snapshot().email };
    return {
      accessToken: await this.tokens.sign(payload, { expiresIn: "15m" }),
      refreshToken: await this.tokens.sign(
        { ...payload, typ: "refresh" },
        { expiresIn: "7d" },
      ),
    };
  }
}
