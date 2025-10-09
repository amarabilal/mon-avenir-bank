export interface MailerPort {
  send(to: string, subject: string, body: string): Promise<void>;
}
