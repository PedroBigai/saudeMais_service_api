// src/controllers/passwordResetController.ts
import { RequestHandler } from "express";
import { requestPasswordReset, verifyPasswordResetToken } from "../modules/passwordReset";
import { getUserIdByEmail, updateUserPassword } from "../modules/users";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const RESET_TTL_MS = 10 * 60 * 1000; // 10 minutos (sessão curta para redefinição)
const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// ======================= helpers JWT de reset =======================
function signResetJWT(userId: number): string {
  return jwt.sign(
    { sub: userId, purpose: "password_reset" },
    JWT_SECRET,
    { expiresIn: Math.floor(RESET_TTL_MS / 1000) } // 600s
  );
}

function verifyResetJWT(
  token: string
): { sub: number; purpose: "password_reset"; exp: number; iat: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload?.purpose !== "password_reset") return null;
    return payload;
  } catch {
    return null;
  }
}

// ======================= opções de cookie =======================
function cookieOpts(maxAge = RESET_TTL_MS) {
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    path: "/",
    maxAge,
  };
}

function csrfCookieOpts(maxAge = RESET_TTL_MS) {
  return {
    httpOnly: false as const, // legível no browser (double-submit)
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    path: "/",
    maxAge,
  };
}

// ======================= validação de sequência =======================
function hasLongSequentialRun(pwd: string, minRun = 4): boolean {
  const isDigit = (c: string) => /[0-9]/.test(c);
  const isAlpha = (c: string) => /[A-Za-z]/.test(c);

  let run = 1;
  let dir = 0; // +1 asc, -1 desc, 0 none

  for (let i = 1; i < pwd.length; i++) {
    const a = pwd[i - 1], b = pwd[i];

    // exige estar no mesmo grupo (dígitos OU letras)
    const sameDigit = isDigit(a) && isDigit(b);
    const sameAlpha = isAlpha(a) && isAlpha(b);
    if (!sameDigit && !sameAlpha) { run = 1; dir = 0; continue; }

    const diff = b.charCodeAt(0) - a.charCodeAt(0);
    const step = (diff === 1 || diff === -1) ? diff : 0;

    if (step !== 0 && (dir === 0 || step === dir)) {
      run += 1;
      dir = step;
      if (run >= minRun) return true; // encontrou sequência de 4+ contígua
    } else {
      dir = step;
      run = step !== 0 ? 2 : 1;
    }
  }
  return false;
}

// ======================= validação de senha =======================
// Regras: >= 8; 1 letra E 1 número; sem 5+ iguais; sem sequências 4+ (asc/desc)
function validateNewPassword(
  pwd: string
): { ok: true } | { ok: false; error: "WEAK_PASSWORD" | "NEEDS_LETTER_AND_DIGIT" | "TOO_REPETITIVE" | "SEQUENTIAL" } {
  if (!pwd || pwd.length < 8) return { ok: false, error: "WEAK_PASSWORD" };

  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasDigit  = /[0-9]/.test(pwd);
  if (!(hasLetter && hasDigit)) return { ok: false, error: "NEEDS_LETTER_AND_DIGIT" };

  // 5 ou mais caracteres iguais em sequência
  if (/(.)\1{3,}/.test(pwd)) return { ok: false, error: "TOO_REPETITIVE" };

  // sequência asc/desc de 4+ dentro do mesmo grupo (abcd/1234/zyxw/9876)
  if (hasLongSequentialRun(pwd, 4)) return { ok: false, error: "SEQUENTIAL" };

  return { ok: true };
}

// ======================= controllers =======================

// (1) Solicitar envio de OTP por e-mail
export const requestPasswordResetController: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ ok: false, error: "EMAIL_REQUIRED" });
      return;
    }

    const result = await requestPasswordReset(email);

    if (!result.ok) {
      // ✅ Limite diário
      if (result.error === "RATE_LIMITED") {
        if (typeof result.retryAfterSec === "number") {
          res.setHeader("Retry-After", String(result.retryAfterSec));
        }
        res.status(429).json({ ok: false, error: "RATE_LIMITED", retryAfterSec: result.retryAfterSec });
        return;
      }
      // ✅ Cooldown curto entre e-mails
      if (result.error === "TOO_SOON") {
        if (typeof result.retryAfterSec === "number") {
          res.setHeader("Retry-After", String(result.retryAfterSec));
        }
        res.status(429).json({ ok: false, error: "TOO_SOON", retryAfterSec: result.retryAfterSec });
        return;
      }

      res.status(400).json(result);
      return;
    }

    res.status(200).json({ ok: true, expiresInSec: result.expiresInSec });
  } catch (err) {
    console.error("requestPasswordResetController error:", err);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// (2) Verificar OTP (token de 6 dígitos) e abrir sessão curta via cookies
export const verifyPasswordResetController: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { email, token } = req.body as { email?: string; token?: string };
    if (!email || !token) {
      res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
      return;
    }

    const result = await verifyPasswordResetToken(email, token);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    const userId = await getUserIdByEmail(email);
    if (!userId) {
      res.status(400).json({ ok: false, error: "EMAIL_NOT_FOUND" });
      return;
    }

    // 1) JWT curto no cookie HttpOnly
    const signed = signResetJWT(userId);
    res.cookie("pr_session", signed, cookieOpts());

    // 2) CSRF double-submit cookie
    const csrf = crypto.randomBytes(16).toString("hex");
    res.cookie("pr_csrf", csrf, csrfCookieOpts());

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("verifyPasswordResetController error:", err);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// (3) Status opcional para o front checar/obter CSRF (e renovar se faltar)
export const passwordResetStatusController: RequestHandler = async (req, res): Promise<void> => {
  try {
    const token = req.cookies?.pr_session as string | undefined;
    if (!token) {
      res.sendStatus(401);
      return;
    }

    const payload = verifyResetJWT(token);
    if (!payload) {
      res.sendStatus(401);
      return;
    }

    // Se já existir pr_csrf, reaproveita; se não, gera um novo
    let csrf = req.cookies?.pr_csrf as string | undefined;
    if (!csrf) {
      csrf = crypto.randomBytes(16).toString("hex");
      res.cookie("pr_csrf", csrf, csrfCookieOpts());
    }

    res.json({ ok: true, csrf });
  } catch (err) {
    console.error("passwordResetStatus error:", err);
    res.sendStatus(500);
  }
};

// (4) Confirmar nova senha (valida sessão + CSRF + troca senha + limpa cookies)
export const passwordResetConfirmController: RequestHandler = async (req, res): Promise<void> => {
  try {
    const token = req.cookies?.pr_session as string | undefined;
    if (!token) { res.sendStatus(401); return; }

    const payload = verifyResetJWT(token);
    if (!payload) { res.sendStatus(401); return; }

    const headerCsrf = req.get("X-CSRF-Token") || "";
    const cookieCsrf = (req.cookies?.pr_csrf as string | undefined) || "";
    if (!headerCsrf || !cookieCsrf || headerCsrf !== cookieCsrf) { res.sendStatus(403); return; }

    const { novaSenha } = req.body as { novaSenha?: string };

    // ===== validação completa =====
    const v = validateNewPassword(novaSenha || "");
    if (!v.ok) {
      res.status(400).json({ ok: false, error: v.error });
      return;
    }

    const ok = await updateUserPassword(Number(payload.sub), novaSenha!);
    if (!ok) {
      res.status(400).json({ ok: false, error: "USER_NOT_FOUND" });
      return;
    }

    // Limpa cookies ao concluir
    res.clearCookie("pr_session", { path: "/" });
    res.clearCookie("pr_csrf",   { path: "/" });

    res.json({ ok: true });
  } catch (err) {
    console.error("passwordResetConfirm error:", err);
    res.sendStatus(500);
  }
};
