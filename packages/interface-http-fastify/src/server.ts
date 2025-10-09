import Fastify from "fastify";
import { fileURLToPath } from "url";

import {
  SignUpCommand,
  ConfirmEmailCommand,
  LoginCommand,
  CreateAccountCommand,
  RenameAccountCommand,
  DeleteAccountCommand,
  GetMyAccountsQuery,
} from "@monavenir/application";

import {
  UserRepository,
  AccountRepository,
  HasherPort,
  TokenPort,
  MailerPort,
  ClockPort,
  IdGeneratorPort,
  IbanGeneratorPort,
} from "@monavenir/application";

import {
  UserRepositoryInMemory,
  AccountRepositoryInMemory,
  BcryptHasher,
  JwtTokenService,
  ConsoleMailer,
  SystemClock,
  UuidGenerator,
  IbanGeneratorService,
} from "@monavenir/infrastructure";

const app = Fastify({ logger: true });

const users: UserRepository = new UserRepositoryInMemory();
const accounts: AccountRepository = new AccountRepositoryInMemory();
const hasher: HasherPort = new BcryptHasher();
const tokens: TokenPort = new JwtTokenService(
  process.env.JWT_SECRET || "dev-secret",
);
const mailer: MailerPort = new ConsoleMailer();
const clock: ClockPort = new SystemClock();
const ids: IdGeneratorPort = new UuidGenerator();
const ibans: IbanGeneratorPort = new IbanGeneratorService();

const signUp = new SignUpCommand(
  users,
  hasher,
  mailer,
  ids,
  clock,
  accounts,
  ibans,
);
const confirmEmail = new ConfirmEmailCommand(users);
const login = new LoginCommand(users, hasher, tokens);
const createAccount = new CreateAccountCommand(accounts, ids, ibans);
const renameAccount = new RenameAccountCommand(accounts);
const deleteAccount = new DeleteAccountCommand(accounts);
const getMyAccounts = new GetMyAccountsQuery(accounts);

app.get("/health", async () => ({ status: "ok" }));
app.get("/", async () => ({
  name: "MonAvenirBank",
  status: "ok",
  docs: "/health",
}));

app.post<{ Body: { email: string; password: string } }>(
  "/auth/signup",
  async (req) => {
    const out = await signUp.execute(req.body);
    return { data: out };
  },
);

app.post<{ Body: { userId: string; token: string } }>(
  "/auth/confirm",
  async (req) => {
    await confirmEmail.execute(req.body);
    return { data: "confirmed" };
  },
);

app.post<{ Body: { email: string; password: string } }>(
  "/auth/login",
  async (req, reply) => {
    try {
      const out = await login.execute(req.body);
      return { data: out };
    } catch {
      return reply.code(401).send({ error: "invalid_credentials" });
    }
  },
);

app.addHook("preHandler", async (req, reply) => {
  const protectedPaths = ["/accounts"];
  if (!protectedPaths.some((p) => req.url.startsWith(p))) return;
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return reply.code(401).send({ error: "unauthorized" });
  const token = auth.slice("Bearer ".length);
  try {
    const payload = await tokens.verify<{ sub: string; email: string }>(token);
    (req as any).user = payload;
  } catch {
    return reply.code(401).send({ error: "invalid_token" });
  }
});

app.get("/accounts", async (req) => {
  const user = (req as any).user;
  return { data: await getMyAccounts.execute({ ownerId: user.sub }) };
});

app.post<{ Body: { name?: string } }>("/accounts", async (req) => {
  const user = (req as any).user;
  const out = await createAccount.execute({
    ownerId: user.sub,
    name: req.body?.name,
  });
  return { data: out };
});

app.patch<{ Params: { id: string }; Body: { name: string } }>(
  "/accounts/:id",
  async (req) => {
    const user = (req as any).user;
    await renameAccount.execute({
      accountId: req.params.id,
      ownerId: user.sub,
      newName: req.body.name,
    });
    return { data: "renamed" };
  },
);

app.delete<{ Params: { id: string } }>("/accounts/:id", async (req) => {
  const user = (req as any).user;
  await deleteAccount.execute({ accountId: req.params.id, ownerId: user.sub });
  return { data: "deleted" };
});

export async function start() {
  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: "0.0.0.0" });
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  start();
}
