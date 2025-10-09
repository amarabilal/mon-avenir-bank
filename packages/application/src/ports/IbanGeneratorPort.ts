export interface IbanGeneratorPort {
  generate(): Promise<string>;
}
