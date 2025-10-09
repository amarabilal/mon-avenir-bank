import {
  RenameAccountCommand,
  SignUpCommand,
  ConfirmEmailCommand,
} from "@monavenir/application";
import {
  AccountRepositoryInMemory,
  UserRepositoryInMemory,
  BcryptHasher,
  ConsoleMailer,
  UuidGenerator,
  SystemClock,
  IbanGeneratorService,
} from "@monavenir/infrastructure";

test("rename account (owner only)", async () => {
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

  const { userId, confirmationToken } = await signUp.execute({
    email: "x@y.com",
    password: "Pass123!",
  });
  await confirm.execute({ userId, token: confirmationToken });

  const myAcc = (await accounts.findByOwner(userId))[0];
  const rename = new RenameAccountCommand(accounts);

  await rename.execute({
    accountId: myAcc.snapshot().id,
    ownerId: userId,
    newName: "Compte salaire",
  });
  expect((await accounts.findById(myAcc.snapshot().id))?.name).toBe(
    "Compte salaire",
  );
});
