// src/utils/validators.ts

// -------- Equivalentes do front --------
export function validade_email(v: string): boolean {
  if (!v) return false;
  // Padrão igual ao navegador <input type="email"> → só exige parte@parte
  const emailLike = /^[^\s@]+@[^\s@]+$/;
  return emailLike.test(v.trim());
}

export function temLetra(s: string): boolean { return /[A-Za-z]/.test(s); }
export function temNumero(s: string): boolean { return /[0-9]/.test(s); }
export function temRepeticao4Seguidas(s: string): boolean { return /(.)\1{3,}/.test(s); }

export function temSequenciaMaiorQue3(s: string): boolean {
  const isDigit = (c: string) => /[0-9]/.test(c);
  const isAlpha = (c: string) => /[A-Za-z]/.test(c);

  let run = 1;
  let dir = 0;

  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    const sameDigit = isDigit(a) && isDigit(b);
    const sameAlpha = isAlpha(a) && isAlpha(b);
    if (!sameDigit && !sameAlpha) { run = 1; dir = 0; continue; }

    const diff = b.charCodeAt(0) - a.charCodeAt(0);
    const step = (diff === 1 || diff === -1) ? diff : 0;

    if (step !== 0 && (dir === 0 || step === dir)) {
      run += 1;
      dir = step;
      if (run >= 4) return true;
    } else {
      dir = step;
      run = step !== 0 ? 2 : 1;
    }
  }
  return false;
}

export function validarSenha(s: string): { ok: boolean; msg?: string } {
  if (!temLetra(s) || !temNumero(s)) {
    return { ok: false, msg: "Deve conter números e letras." };
  }
  if (temRepeticao4Seguidas(s)) {
    return { ok: false, msg: "Repetição excessiva de caracteres." };
  }
  if (temSequenciaMaiorQue3(s)) {
    return { ok: false, msg: "Senha fraca" };
  }
  return { ok: true };
}

// -------- Utilitários extras --------
export function parseNumber(val: any): number {
  if (val === null || val === undefined) return NaN;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(/[^\d.,-]+/g, "").replace(",", "."));
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return false;

  const [y, m, day] = iso.split("-").map(Number);
  return d.getUTCFullYear() === y && (d.getUTCMonth() + 1) === m && d.getUTCDate() === day;
}

export function normalizeSexo(v: string): "feminino" | "masculino" | "" {
  const s = String(v || "").trim().toLowerCase();
  if (s === "f" || s === "feminino") return "feminino";
  if (s === "m" || s === "masculino") return "masculino";
  return "";
}

export function normalizeObjetivo(v: any): "1" | "2" | "3" | "" {
  const s = String(v || "").trim();
  return s === "1" || s === "2" || s === "3" ? s : "";
}

// -------- Bloqueio de espaços --------
export function hasSpaces(s: string): boolean {
  return /\s/.test(s);
}

// -------- Validador do payload de cadastro --------
export function validateCadastroPayload(raw: any) {
  const errors: Record<string, string> = {};

  const nome = String(raw?.nome || "").trim();
  const email = String(raw?.email || "").trim();
  const senha = String(raw?.senha || "");

  const altura = parseNumber(raw?.altura);
  const peso = parseNumber(raw?.peso);
  const nascimento = String(raw?.nascimento || "").trim();
  const sexo = normalizeSexo(raw?.sexo);
  const objetivo = normalizeObjetivo(raw?.objetivo);

  // Nome
  if (!nome) {
    errors.nome = "Campo obrigatório";
  } else if (hasSpaces(nome)) {
    errors.nome = "Não pode conter espaços";
  }

  // E-mail
  if (!email) {
    errors.email = "Campo obrigatório";
  } else if (hasSpaces(email)) {
    errors.email = "Não pode conter espaços";
  } else if (!validade_email(email)) {
    errors.email = "Formato de E-mail inválido";
  }

  // Senha
  if (!senha) {
    errors.senha = "Campo obrigatório";
  } else if (hasSpaces(senha)) {
    errors.senha = "Não pode conter espaços";
  } else {
    const v = validarSenha(senha);
    if (!v.ok) errors.senha = v.msg || "Senha inválida";
  }

  // Nascimento
  if (!nascimento) {
    errors.nascimento = "Informe sua data de nascimento";
  } else if (hasSpaces(nascimento)) {
    errors.nascimento = "Não pode conter espaços";
  } else if (!isValidISODate(nascimento)) {
    errors.nascimento = "Data inválida (use YYYY-MM-DD)";
  }

  // Sexo
  if (!sexo) {
    errors.sexo = "Selecione seu sexo";
  } else if (hasSpaces(sexo)) {
    errors.sexo = "Não pode conter espaços";
  }

  // Peso
  if (isNaN(peso) || peso < 20 || peso > 400) {
    errors.peso = "Peso inválido (20 a 400 kg)";
  }

  // Altura
  if (isNaN(altura) || altura < 80 || altura > 250) {
    errors.altura = "Altura inválida (80 a 250 cm)";
  }

  // Objetivo
  if (!objetivo) {
    errors.objetivo = "Selecione seu objetivo";
  } else if (hasSpaces(objetivo)) {
    errors.objetivo = "Não pode conter espaços";
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    data: ok
      ? { nome, email, senha, altura, peso, nascimento, sexo, objetivo }
      : null,
  };
}
