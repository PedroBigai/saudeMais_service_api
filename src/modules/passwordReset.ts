// src/modules/passwordReset.ts
import { sendMailPasswordReset } from "../utils/mailer";
import { otpStore } from "../utils/otpStore";
import { verifyEmail } from "./verifyEmail";
import { emailResetLimiter } from "../utils/resetRateLimiter";

const OTP_TTL_MS = 10 * 60 * 1000; 
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s entre e-mails

export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  error?: string;
  expiresInSec?: number;
  retryAfterSec?: number;
}> {
  // 1) e-mail precisa EXISTIR
  const disponivel = await verifyEmail(email);
  if (disponivel) return { ok: false, error: "EMAIL_NOT_FOUND" };

  // 2) pré-checagem: decidir reuse/new/too_soon (sem alterar estado)
  const prep = otpStore.prepare(email, OTP_TTL_MS, RESEND_COOLDOWN_MS);
  if (!prep.ok) {
    return { ok: false, error: "TOO_SOON", retryAfterSec: prep.retryAfterSec };
  }

  // 3) cota diária (consumo provisório)
  const rl = emailResetLimiter.consume(email);
  if (!rl.ok) {
    return { ok: false, error: "RATE_LIMITED", retryAfterSec: rl.retryAfterSec };
  }

  // 4) tenta enviar e-mail
  const sent = await sendMailPasswordReset(email, prep.code);
  if (!sent) {
    // envio falhou → reembolsa cota e não muda cooldown/OTP
    emailResetLimiter.refund(email);
    return { ok: false, error: "MAIL_FAIL" };
  }

  // 5) envio OK → confirma estado do OTP
  if (prep.kind === "new") {
    otpStore.saveNew(email, prep.code, prep.expiresAt);
  } else {
    otpStore.markSent(email);
  }

  const expiresInSec = Math.max(1, Math.ceil((prep.expiresAt - Date.now()) / 1000));
  return { ok: true, expiresInSec };
}

export async function verifyPasswordResetToken(email: string, token: string): Promise<{ ok: boolean; error?: string; }> {
  const entry = otpStore.get(email);
  if (!entry) return { ok: false, error: "TOKEN_INVALID" };

  if (Date.now() >= entry.expiresAt) {
    otpStore.invalidate(email);
    return { ok: false, error: "TOKEN_EXPIRED" };
  }

  if (entry.attempts >= entry.maxAttempts) {
    otpStore.invalidate(email);
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  entry.attempts += 1;

  if (token !== entry.code) {
    return { ok: false, error: "TOKEN_INVALID" };
  }

  otpStore.invalidate(email);
  return { ok: true };
}
