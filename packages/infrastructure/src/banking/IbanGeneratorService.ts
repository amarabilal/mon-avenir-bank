import { IbanGeneratorPort } from "@monavenir/application";

export class IbanGeneratorService implements IbanGeneratorPort {
  async generate(): Promise<string> {
    const bban = this.randomAlnum(23);
    const check = this.computeCheckDigits("FR", bban); // 2 digits
    return `FR${check}${bban}`;
  }

  private randomAlnum(len: number): string {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let out = "";
    for (let i = 0; i < len; i++)
      out += chars[(Math.random() * chars.length) | 0];
    return out;
  }

  private computeCheckDigits(country: string, bban: string): string {
    // IBAN check: take BBAN + country + "00", map letters A=10..Z=35, compute 98 - mod97
    const rearranged = `${bban}${country}00`;
    const mapped = rearranged
      .split("")
      .map((ch) => (/[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch))
      .join("");

    // mod97 par blocs (éviter overflow)
    let remainder = 0;
    for (let i = 0; i < mapped.length; i += 7) {
      const block = `${remainder}${mapped.slice(i, i + 7)}`;
      remainder = parseInt(block, 10) % 97;
    }
    const check = 98 - remainder;
    return check < 10 ? `0${check}` : String(check);
  }
}
