import { ClockPort } from "@monavenir/application";
export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
