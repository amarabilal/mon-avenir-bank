import {
  UserRepository,
  HasherPort,
  MailerPort,
  IdGeneratorPort,
  ClockPort,
  AccountRepository,
  IbanGeneratorPort,
} from "../ports";
import {
  Email,
  PasswordHash,
  User,
  Account,
  Iban,
  Money,
} from "@monavenir/domain";

export type SignUpInput = { email: string; password: string };
export type SignUpOutput = { userId: string; confirmationToken: string };

export class SignUpCommand {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: HasherPort,
    private readonly mailer: MailerPort,
    private readonly ids: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly accounts: AccountRepository,
    private readonly ibans: IbanGeneratorPort,
  ) {}

  async execute(input: SignUpInput): Promise<SignUpOutput> {
    const email = Email.create(input.email);
    const existing = await this.users.findByEmail(email.toString());
    if (existing) throw new Error("Email already used");

    const hash = await this.hasher.hash(input.password);
    const token = this.ids.next();
    const user = new User(
      this.ids.next(),
      email,
      PasswordHash.from(hash),
      token,
      null,
    );

    await this.users.save(user);
    await this.mailer.send(
      email.toString(),
      "Confirm your account",
      `Token: ${token}`,
    );

    // Crée un compte par défaut dès l'inscription - demande metier (IBAN généré) - Bilal
    const defaultAcc = new Account(
      this.ids.next(),
      "Compte courant",
      user.snapshot().id,
      Money.fromEuros(0),
    );
    const iban = Iban.create(await this.ibans.generate());
    defaultAcc.linkIban(iban);
    await this.accounts.save(defaultAcc);

    return { userId: user.snapshot().id, confirmationToken: token };
  }
}
