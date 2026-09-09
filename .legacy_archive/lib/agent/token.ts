import crypto from 'crypto';

export interface GeneratedToken {
  plainToken: string;
  tokenPrefix: string;
  tokenHash: string;
}

/**
 * Menghasilkan Personal Access Token (PAT) berawalan `pak_`
 * Format: pak_<32 byte random hex> (total 68 karakter)
 * Token disimpan di database hanya dalam bentuk SHA-256 hash demi keamanan.
 */
export function generatePersonalAccessToken(name: string): GeneratedToken {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const plainToken = `pak_${randomBytes}`;
  const tokenPrefix = plainToken.substring(0, 10); // e.g. pak_a1b2c3d
  const tokenHash = hashToken(plainToken);

  return {
    plainToken,
    tokenPrefix,
    tokenHash,
  };
}

/**
 * Menghasilkan SHA-256 hash dari token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Memvalidasi format dasar Personal Access Token
 */
export function isValidTokenFormat(token: string): boolean {
  return /^pak_[a-f0-9]{64}$/.test(token);
}
