/**
 * PURE CRYPTOGRAPHIC HMAC-SHA256 ENGINE
 * RFC 2104 compliant HMAC-SHA256 with constant-time equality check.
 * Zero external libraries. Runs universally across Node.js, Jest, React Native Hermes, and Web.
 */

export class HmacSha256 {
  /**
   * Constant-time comparison between two hex strings to prevent timing attacks.
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;

    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }

  /**
   * Computes HMAC-SHA256 hex digest for a given message and secret.
   */
  static compute(message: string, secret: string): string {
    // If running in Node/Jest with native crypto available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto');
      if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
        return nodeCrypto.createHmac('sha256', secret).update(message).digest('hex');
      }
    } catch {
      // Fall through to pure TS implementation
    }

    return this.pureTsHmacSha256(message, secret);
  }

  // ── Pure TypeScript SHA-256 & HMAC Implementation ──

  private static rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
  }

  private static choose(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
  }

  private static majority(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
  }

  private static sigma0(x: number): number {
    return this.rotr(2, x) ^ this.rotr(13, x) ^ this.rotr(22, x);
  }

  private static sigma1(x: number): number {
    return this.rotr(6, x) ^ this.rotr(11, x) ^ this.rotr(25, x);
  }

  private static gamma0(x: number): number {
    return this.rotr(7, x) ^ this.rotr(18, x) ^ (x >>> 3);
  }

  private static gamma1(x: number): number {
    return this.rotr(17, x) ^ this.rotr(19, x) ^ (x >>> 10);
  }

  private static readonly K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  private static sha256Bytes(data: Uint8Array): Uint8Array {
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const bitLength = data.length * 8;
    const newLen = (((data.length + 8) >> 6) + 1) << 6;
    const padded = new Uint8Array(newLen);
    padded.set(data);
    padded[data.length] = 0x80;

    const view = new DataView(padded.buffer);
    // Write 64-bit big-endian length at end
    view.setUint32(newLen - 4, bitLength >>> 0, false);
    view.setUint32(newLen - 8, Math.floor(bitLength / 0x100000000), false);

    const w = new Uint32Array(64);

    for (let i = 0; i < newLen; i += 64) {
      for (let j = 0; j < 16; j++) {
        w[j] = view.getUint32(i + j * 4, false);
      }
      for (let j = 16; j < 64; j++) {
        w[j] = (this.gamma1(w[j - 2]) + w[j - 7] + this.gamma0(w[j - 15]) + w[j - 16]) | 0;
      }

      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;

      for (let j = 0; j < 64; j++) {
        const t1 = (h + this.sigma1(e) + this.choose(e, f, g) + this.K[j] + w[j]) | 0;
        const t2 = (this.sigma0(a) + this.majority(a, b, c)) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }

      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
      h5 = (h5 + f) | 0;
      h6 = (h6 + g) | 0;
      h7 = (h7 + h) | 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
  }

  private static pureTsHmacSha256(message: string, secret: string): string {
    const encoder = new TextEncoder();
    let keyBytes = encoder.encode(secret);

    // If key > 64 bytes, hash it first
    if (keyBytes.length > 64) {
      keyBytes = this.sha256Bytes(keyBytes);
    }

    // Pad key to 64 bytes
    const paddedKey = new Uint8Array(64);
    paddedKey.set(keyBytes);

    const oKeyPad = new Uint8Array(64);
    const iKeyPad = new Uint8Array(64);

    for (let i = 0; i < 64; i++) {
      oKeyPad[i] = paddedKey[i] ^ 0x5c;
      iKeyPad[i] = paddedKey[i] ^ 0x36;
    }

    const msgBytes = encoder.encode(message);
    const inner = new Uint8Array(64 + msgBytes.length);
    inner.set(iKeyPad, 0);
    inner.set(msgBytes, 64);
    const innerHash = this.sha256Bytes(inner);

    const outer = new Uint8Array(64 + 32);
    outer.set(oKeyPad, 0);
    outer.set(innerHash, 64);
    const outerHash = this.sha256Bytes(outer);

    let hex = '';
    for (let i = 0; i < outerHash.length; i++) {
      hex += outerHash[i].toString(16).padStart(2, '0');
    }
    return hex;
  }
}
