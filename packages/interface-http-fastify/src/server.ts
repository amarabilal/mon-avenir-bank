import Fastify from "fastify";
import { GetHealth } from "@monavenir/application";

const app = Fastify({ logger: true });
const health = new GetHealth();

app.get("/health", async () => health.execute());

app.get("/", async () => ({
  name: "MonAvenirBank",
  status: "ok",
  docs: "/health",
}));

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
