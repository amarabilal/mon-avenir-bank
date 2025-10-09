export interface TokenPort {
  sign(
    payload: Record<string, any>,
    opts?: { expiresIn?: string },
  ): Promise<string>;
  verify<T>(token: string): Promise<T>;
}
