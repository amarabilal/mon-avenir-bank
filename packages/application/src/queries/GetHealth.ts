export class GetHealth {
  execute() {
    return { status: "ok" as const };
  }
}
