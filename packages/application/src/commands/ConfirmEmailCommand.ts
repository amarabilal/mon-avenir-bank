import { UserRepository } from "../ports";

export type ConfirmEmailInput = { userId: string; token: string };

export class ConfirmEmailCommand {
  constructor(private readonly users: UserRepository) {}
  async execute(input: ConfirmEmailInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new Error("User not found");
    user.confirm(input.token);
    await this.users.save(user);
  }
}
