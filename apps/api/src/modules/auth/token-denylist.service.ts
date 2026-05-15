import { Injectable } from '@nestjs/common';

// In-memory refresh-token denylist for Phase 1.
// Week 11: replace with Redis (`ioredis` set with TTL = refresh expiry).
@Injectable()
export class TokenDenylistService {
  private readonly revoked = new Map<string, number>();

  revoke(jti: string, expiresAt: number): void {
    this.revoked.set(jti, expiresAt);
    this.purgeExpired();
  }

  isRevoked(jti: string): boolean {
    this.purgeExpired();
    return this.revoked.has(jti);
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, exp] of this.revoked) {
      if (exp < now) this.revoked.delete(key);
    }
  }
}
