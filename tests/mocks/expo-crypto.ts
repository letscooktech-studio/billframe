import * as crypto from 'crypto';

export enum CryptoDigestAlgorithm {
  SHA256 = 'SHA-256',
}

export async function digestStringAsync(
  algorithm: string,
  str: string,
  options?: { encoding?: 'hex' | 'base64' }
): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}
