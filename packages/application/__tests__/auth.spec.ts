import {
  SignUpCommand,
  ConfirmEmailCommand,
  LoginCommand,
} from "@monavenir/application";
import { UserRepositoryInMemory } from "@monavenir/infrastructure";
import {
  BcryptHasher,
  JwtTokenService,
  ConsoleMailer,
  SystemClock,
  UuidGenerator,
  IbanGeneratorService,
} from "@monavenir/infrastructure";
import { AccountRepositoryInMemory } from "@monavenir/infrastructure";

describe("Auth flow", () => {
  test("signup -> confirm -> login OK", async () => {
    const users = new UserRepositoryInMemory();
    const accounts = new AccountRepositoryInMemory();
    const signUp = new SignUpCommand(
      users,
      new BcryptHasher(),
      new ConsoleMailer(),
      new UuidGenerator(),
      new SystemClock(),
      accounts,
      new IbanGeneratorService(),
    );
    const confirm = new ConfirmEmailCommand(users);
    const login = new LoginCommand(
      users,
      new BcryptHasher(),
      new JwtTokenService("test-secret"),
    );

    const { userId, confirmationToken } = await signUp.execute({
      email: "a@b.com",
      password: "S3cret!",
    });
    await confirm.execute({ userId, token: confirmationToken });
    const { accessToken } = await login.execute({
      email: "a@b.com",
      password: "S3cret!",
    });

    expect(typeof accessToken).toBe("string");
    const myAccounts = await accounts.findByOwner(userId);
    expect(myAccounts.length).toBe(1);
    expect(myAccounts[0].snapshot().iban).toBeTruthy();
  });

  test("login KO avant confirmation & mauvais mot de passe", async () => {
    const users = new UserRepositoryInMemory();
    const accounts = new AccountRepositoryInMemory();
    const signUp = new SignUpCommand(
      users,
      new BcryptHasher(),
      new ConsoleMailer(),
      new UuidGenerator(),
      new SystemClock(),
      accounts,
      new IbanGeneratorService(),
    );
    const confirm = new ConfirmEmailCommand(users);
    const login = new LoginCommand(
      users,
      new BcryptHasher(),
      new JwtTokenService("test-secret"),
    );

    const { userId, confirmationToken } = await signUp.execute({
      email: "b@c.com",
      password: "OKOKOK",
    });
    await expect(
      login.execute({ email: "b@c.com", password: "OKOKOK" }),
    ).rejects.toThrow();

    await confirm.execute({ userId, token: confirmationToken });
    await expect(
      login.execute({ email: "b@c.com", password: "WRONG" }),
    ).rejects.toThrow();
  });
});
