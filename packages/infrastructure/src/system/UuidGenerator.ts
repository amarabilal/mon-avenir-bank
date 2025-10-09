import { IdGeneratorPort } from "@monavenir/application";
import { randomUUID } from "crypto";
export class UuidGenerator implements IdGeneratorPort {
  next(): string {
    return randomUUID();
  }
}
