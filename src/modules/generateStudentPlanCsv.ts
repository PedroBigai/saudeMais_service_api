import Groq from "groq-sdk";
import {
  convertDietJsonToCsv,
  convertExerciseJsonToCsv,
  GeneratedPlanJson,
} from "./convertPlanJsonToCsv";
import { loadPlanCsvTemplate } from "./loadPlanCsvTemplates";
import { loadUserData } from "./loadUserData";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",           // ★★★ Melhor para uso diário (mais rápido + limite alto)
  // "gemma2-9b-it",                   // ★★ Excelente equilíbrio qualidade/velocidade
  // "qwen-qwq-32b",                   // ★★ Muito bom em seguir instruções e JSON
  // "llama-3.3-70b-versatile",        // ★★★ Melhor qualidade (mas limite mais baixo)
  // "llama-3.1-70b-versatile",        // Boa alternativa ao 3.3
] as const;

export class GroqRateLimitError extends Error {
  code = "groq_rate_limit";
  retryAfterSec: number;
  retryAfterHuman: string;

  constructor(retryAfterSec: number, retryAfterHuman: string, message?: string) {
    super(message || "Limite do Groq atingido.");
    this.name = "GroqRateLimitError";
    this.retryAfterSec = retryAfterSec;
    this.retryAfterHuman = retryAfterHuman;
  }
}

interface GenerateStudentPlanCsvParams {
  alunoId: number;
  mensagem: string;
  tipoPlano: "dieta" | "exercicios";
}

const DIETA_CSV_HEADER =
  "weekday,title,time,calories,carbs_g,protein_g,fat_g,descricao,image_url,alimento_nome,alimento_quantidade_g";
const EXERCICIOS_CSV_HEADER =
  "weekday,title,muscle_group,sets,reps,weight,rest_seconds,distance_km,time_minutes,descricao,image_url";

function extractJsonFromResponse(text: string): GeneratedPlanJson {
  const cleanedText = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedText) as GeneratedPlanJson;
  } catch (error) {
    console.error("JSON bruto retornado pelo Groq:");
    console.error(cleanedText);
    throw new Error("O Groq retornou JSON inválido.");
  }
}

type TipoPlano = "dieta" | "exercicios";

function buildEssentialStudentContext(dadosAluno: any) {
  const usuario = dadosAluno?.dados_usuario || {};
  const extra = dadosAluno?.extra || {};
  const medidas = extra?.medidas_corporais || {};

  return {
    nome: usuario.nome || extra.nome || null,
    idade: usuario.idade || extra.idade || null,
    sexo: usuario.sexo || extra.sexo || null,
    peso_kg: usuario.peso ?? extra.peso ?? null,
    altura_cm: usuario.altura ?? extra.altura ?? null,
    objetivo: extra.objetivo ?? null,
    nivel: extra.nivel_atividade || extra.nivel || null,
    restricoes: extra.restricoes_alimentares || extra.restricoes || null,
    observacoes: extra.observacoes || null,
    medidas_corporais: {
      cintura: medidas.cintura ?? null,
      quadril: medidas.quadril ?? null,
      peito: medidas.peitoral ?? medidas.peito ?? null,
    },
  };
}

function formatRetryAfterHuman(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m${seconds}s`;
  }

  return `${seconds}s`;
}

function parseRetryAfterSec(error: unknown) {
  const groqError = error as {
    headers?: Headers;
    message?: string;
    error?: { message?: string };
  };

  const headerValue = groqError?.headers?.get("retry-after");
  if (headerValue) {
    const parsed = Number(headerValue);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const message = groqError?.message || groqError?.error?.message || "";
  const match = message.match(/try again in\s+(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Math.ceil(Number(match[3] || 0));

  return hours * 3600 + minutes * 60 + seconds;
}

function isRetryableGroqError(error: unknown) {
  const groqError = error as {
    status?: number;
    code?: string;
    message?: string;
    error?: { message?: string; type?: string; code?: string };
  };

  const status = groqError?.status;
  const message = [
    groqError?.message,
    groqError?.error?.message,
    groqError?.code,
    groqError?.error?.code,
    groqError?.error?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (status === 429 || status === 503 || status === 504) {
    return true;
  }

  return ["rate limit", "quota", "too many requests", "temporar", "timeout", "overloaded"].some(
    (term) => message.includes(term),
  );
}

function isGroqRateLimitError(error: unknown) {
  const groqError = error as {
    status?: number;
    message?: string;
    error?: { message?: string; code?: string; type?: string };
  };

  const combinedMessage = [groqError?.message, groqError?.error?.message, groqError?.error?.code, groqError?.error?.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return groqError?.status === 429 || combinedMessage.includes("rate_limit_exceeded");
}

async function createGroqCompletion(params: {
  groq: Groq;
  prompt: string;
}) {
  let lastError: unknown;
  let bestRateLimitError: GroqRateLimitError | null = null;

  for (const model of GROQ_MODELS) {
    try {
      // console.log(`[Groq] Tentando modelo: ${model}`);

      const response = await params.groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "Você NUNCA adiciona campos extras. Use apenas as colunas listadas. Seja extremamente fiel ao formato solicitado.",
          },
          { role: "user", content: params.prompt },
        ],
        temperature: 0.25,
        max_tokens: 10000,
        response_format: { type: "json_object" },
      });

      //console.log(`[Groq] Modelo utilizado: ${model}`);
      //console.log("Tokens usados:", response.usage?.total_tokens);

      return { response, modelUsed: model };
    } catch (error) {
      lastError = error;
      console.error(`[Groq] Falha com modelo ${model}:`, error);

      if (isGroqRateLimitError(error)) {
        const retryAfterSec = parseRetryAfterSec(error);
        const rateLimitError = new GroqRateLimitError(
          retryAfterSec,
          formatRetryAfterHuman(retryAfterSec),
          "Limite diário do modelo de IA atingido.",
        );

        if (!bestRateLimitError || retryAfterSec > bestRateLimitError.retryAfterSec) {
          bestRateLimitError = rateLimitError;
        }

        continue;
      }

      if (!isRetryableGroqError(error)) {
        throw error;
      }
    }
  }

  if (bestRateLimitError) {
    throw bestRateLimitError;
  }

  throw lastError;
}

function getFallbackReason(error: unknown) {
  if (error instanceof GroqRateLimitError) {
    return error.code;
  }

  if (error instanceof Error) {
    if (error.message.includes("JSON inválido")) {
      return "invalid_json";
    }

    if (error.message.includes("Formato inválido") || error.message.includes("deve ser array")) {
      return "invalid_ai_payload";
    }
  }

  return "ai_generation_failed";
}

function buildFallbackFiles(params: {
  tipoPlano: TipoPlano;
  templateContent: string;
}) {
  const { tipoPlano, templateContent } = params;

  return {
    dieta:
      tipoPlano === "dieta"
        ? templateContent
        : DIETA_CSV_HEADER,
    exercicios:
      tipoPlano === "exercicios"
        ? templateContent
        : EXERCICIOS_CSV_HEADER,
  };
}

function validateGeneratedPlan(plan: GeneratedPlanJson, tipoPlano: TipoPlano) {
  if (!plan || typeof plan !== "object") {
    throw new Error("Formato inválido: resposta não é um objeto.");
  }

  if (tipoPlano === "dieta") {
    if (!Array.isArray(plan.dieta)) throw new Error("dieta deve ser array.");
    if (plan.dieta.length === 0) throw new Error("Dieta não pode estar vazia quando solicitada.");
    return;
  }

  if (!Array.isArray(plan.exercicios)) throw new Error("exercicios deve ser array.");
  if (plan.exercicios.length === 0) throw new Error("Exercícios não podem estar vazios quando solicitados.");
}

function buildPrompt(params: {
  tipoPlano: TipoPlano;
  dadosAluno: unknown;
  template: { headers: string[]; sampleLines: string };
  mensagem: string;
}) {
  const { tipoPlano, dadosAluno, template, mensagem } = params;
  const contextoAluno = JSON.stringify(buildEssentialStudentContext(dadosAluno), null, 2);

  if (tipoPlano === "dieta") {
    return `
Você é um nutricionista extremamente preciso e disciplinado.

Gere somente um plano de dieta em JSON seguindo EXATAMENTE as colunas permitidas.

Dados do aluno:
${contextoAluno}

Colunas permitidas no CSV de dieta:
${template.headers.join(",")}

Exemplo real do modelo de dieta:
${template.sampleLines}

Regras obrigatórias para dieta:
- Gere EXATAMENTE 7 dias (weekday 1=Segunda até 7=Domingo)
- Cada dia deve ter exatamente 4 refeições: Café da Manhã, Almoço, Café da Tarde, Jantar
- Cada refeição deve ter 2 a 4 alimentos
- Cada item do array representa UM alimento de uma refeição
- Se uma refeição tiver 3 alimentos, gere 3 objetos repetindo os dados da refeição e mudando apenas alimento_nome e alimento_quantidade_g
- Não crie nenhum campo extra
- Use apenas as colunas listadas
- Responda somente com JSON válido
- Não use markdown
- Não explique nada

Prompt do professor:
${mensagem}

Responda exatamente assim:
{
  "dieta": []
}
`;
  }

  return `
Você é um treinador extremamente preciso e disciplinado.

Gere somente um plano de exercicios em JSON seguindo EXATAMENTE as colunas permitidas.

Dados do aluno:
${contextoAluno}

Colunas permitidas no CSV de exercicios:
${template.headers.join(",")}

Exemplo real do modelo de exercicios:
${template.sampleLines}

Regras obrigatórias para exercicios:
- Gere entre 5 e 8 exercícios no total
- Distribua os exercícios pelos dias de forma coerente
- Use apenas as colunas listadas
- Não crie nenhum campo extra
- Para cardio, use distance_km e time_minutes
- Para musculação, use sets, reps, weight e rest_seconds
- Quando um campo não se aplicar, retorne string vazia
- Responda somente com JSON válido
- Não use markdown
- Não explique nada

Prompt do professor:
${mensagem}

Responda exatamente assim:
{
  "exercicios": []
}
`;
}

export const generateStudentPlanCsv = async ({
  alunoId,
  mensagem,
  tipoPlano,
}: GenerateStudentPlanCsvParams) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada.");
  }

  const [dadosAluno, template] = await Promise.all([
    loadUserData(alunoId),
    loadPlanCsvTemplate(tipoPlano),
  ]);

  if (!dadosAluno) {
    throw new Error("ALUNO_NOT_FOUND");
  }

  const groq = new Groq({ apiKey });

  const prompt = buildPrompt({ tipoPlano, dadosAluno, template, mensagem });

  try {
    const { response, modelUsed } = await createGroqCompletion({ groq, prompt });

    const rawText = response.choices[0]?.message?.content || "";

    const generatedPlan = extractJsonFromResponse(rawText);

    validateGeneratedPlan(generatedPlan, tipoPlano);

    const dietaCsv =
      tipoPlano === "dieta" && generatedPlan.dieta
        ? convertDietJsonToCsv(generatedPlan.dieta)
        : DIETA_CSV_HEADER;

    const exerciciosCsv =
      tipoPlano === "exercicios" && generatedPlan.exercicios
        ? convertExerciseJsonToCsv(generatedPlan.exercicios)
        : EXERCICIOS_CSV_HEADER;

    return {
      modelUsed,
      fallbackUsed: false,
      aluno: {
        id: alunoId,
        nome: dadosAluno.dados_usuario?.nome,
      },
      files: {
        dieta: { filename: `dieta_aluno_${alunoId}.csv`, content: dietaCsv },
        exercicios: { filename: `exercicios_aluno_${alunoId}.csv`, content: exerciciosCsv },
      },
    };
  } catch (error) {
    console.error("[Plan CSV] Usando fallback por template:", error);

    const fallbackFiles = buildFallbackFiles({
      tipoPlano,
      templateContent: template.content,
    });

    return {
      modelUsed: null,
      fallbackUsed: true,
      fallbackReason: getFallbackReason(error),
      aluno: {
        id: alunoId,
        nome: dadosAluno.dados_usuario?.nome,
      },
      files: {
        dieta: { filename: `dieta_aluno_${alunoId}.csv`, content: fallbackFiles.dieta },
        exercicios: { filename: `exercicios_aluno_${alunoId}.csv`, content: fallbackFiles.exercicios },
      },
    };
  }
};
