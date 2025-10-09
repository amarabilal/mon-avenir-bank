import { MailerPort } from "@monavenir/application";

export class ConsoleMailer implements MailerPort {
  async send(to: string, subject: string, body: string) {
    console.log(`[MAIL -> ${to}] ${subject}\n${body}`);
  }
}
