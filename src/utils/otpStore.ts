// src/utils/otpStore.ts

function randomDigits(n = 6): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export type OtpEntry = {
  code: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  lastSentAt: number; // para cooldown de reenvio
};

class OtpStore {
  private map = new Map<string, OtpEntry>();
  private key(email: string) { return email.toLowerCase(); }

  /** Retorna a entrada ativa (não expirada) ou undefined. */
  getActive(email: string): OtpEntry | undefined {
    const k = this.key(email);
    const e = this.map.get(k);
    if (!e) return undefined;
    if (Date.now() >= e.expiresAt) {
      this.map.delete(k);
      return undefined;
    }
    return e;
  }

  /**
   * Fase 1 (pré-envio): decide se vamos reutilizar OTP ativo (respeitando cooldown)
   * ou criar um novo. NÃO altera estado ainda.
   */
  prepare(
    email: string,
    ttlMs: number,
    resendCooldownMs: number
  ):
    | { ok: true; kind: "reuse"; code: string; expiresAt: number }
    | { ok: true; kind: "new"; code: string; expiresAt: number }
    | { ok: false; error: "TOO_SOON"; retryAfterSec: number } {
    const now = Date.now();
    const active = this.getActive(email);

    if (active) {
      const elapsed = now - (active.lastSentAt || 0);
      if (elapsed < resendCooldownMs) {
        return { ok: false, error: "TOO_SOON", retryAfterSec: Math.ceil((resendCooldownMs - elapsed) / 1000) };
      }
      return { ok: true, kind: "reuse", code: active.code, expiresAt: active.expiresAt };
    }

    const code = randomDigits(6);
    const expiresAt = now + ttlMs;
    return { ok: true, kind: "new", code, expiresAt };
  }

  /** Fase 2a (pós-envio OK): salva novo OTP. */
  saveNew(email: string, code: string, expiresAt: number): void {
    this.map.set(this.key(email), {
      code,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      lastSentAt: Date.now(),
    });
  }

  /** Fase 2b (pós-envio OK): marca reenvio do OTP existente. */
  markSent(email: string): void {
    const k = this.key(email);
    const e = this.map.get(k);
    if (e) e.lastSentAt = Date.now();
  }

  /** Usado na verificação. */
  get(email: string): OtpEntry | undefined {
    return this.map.get(this.key(email));
  }

  invalidate(email: string): void {
    this.map.delete(this.key(email));
  }
}

export const otpStore = new OtpStore();
