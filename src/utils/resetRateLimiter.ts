// src/utils/resetRateLimiter.ts

type Entry = {
  count: number;
  resetAt: number; // timestamp (ms) de quando a cota zera (meia-noite)
};

function nextMidnightTs(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime();
}

/**
 * Limita N solicitações por e-mail por dia (reseta à meia-noite).
 * Em memória. Para várias instâncias, use Redis.
 */
export class DailyEmailRateLimiter {
  private map = new Map<string, Entry>();
  private maxPerDay: number;

  constructor(maxPerDay: number = Number(process.env.MAX_RESET_PER_DAY || 3)) {
    this.maxPerDay = maxPerDay;
  }

  /** Consome 1 cota (se houver). */
  public consume(emailRaw: string):
    | { ok: true; remaining: number; resetAt: number }
    | { ok: false; retryAfterSec: number; resetAt: number } {
    const email = emailRaw.trim().toLowerCase();
    const now = Date.now();
    let entry = this.map.get(email);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: nextMidnightTs() };
      this.map.set(email, entry);
    }

    if (entry.count >= this.maxPerDay) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return { ok: false, retryAfterSec, resetAt: entry.resetAt };
    }

    entry.count += 1;
    const remaining = Math.max(0, this.maxPerDay - entry.count);
    return { ok: true, remaining, resetAt: entry.resetAt };
  }

  /** Desfaz 1 consumo (se o dia ainda não virou). */
  public refund(emailRaw: string): void {
    const email = emailRaw.trim().toLowerCase();
    const entry = this.map.get(email);
    if (!entry) return;

    if (Date.now() >= entry.resetAt) {
      this.map.delete(email);
      return;
    }
    entry.count = Math.max(0, entry.count - 1);
  }

  /** (Opcional) diagnóstico */
  public getDebug(emailRaw: string): Entry | undefined {
    return this.map.get(emailRaw.trim().toLowerCase());
  }
}

export const emailResetLimiter = new DailyEmailRateLimiter();
