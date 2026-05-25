const DIETA_HEADERS = [
  "weekday",
  "title",
  "time",
  "calories",
  "carbs_g",
  "protein_g",
  "fat_g",
  "descricao",
  "image_url",
  "alimento_nome",
  "alimento_quantidade_g",
] as const;

const EXERCICIOS_HEADERS = [
  "weekday",
  "title",
  "muscle_group",
  "sets",
  "reps",
  "weight",
  "rest_seconds",
  "distance_km",
  "time_minutes",
  "descricao",
  "image_url",
] as const;

type DietaHeader = (typeof DIETA_HEADERS)[number];
type ExercicioHeader = (typeof EXERCICIOS_HEADERS)[number];

type JsonRow = Record<string, unknown>;

export interface GeneratedPlanJson {
  dieta?: JsonRow[];
  exercicios?: JsonRow[];
}

function isPlainObject(value: unknown): value is JsonRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateWeekday(value: unknown) {
  const weekday = Number(value);

  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new Error("weekday inválido no retorno do Gemini.");
  }

  return weekday;
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  throw new Error("Valor inválido no retorno do Gemini.");
}

function validateAndNormalizeRows<T extends readonly string[]>(
  rows: unknown,
  headers: T,
): Record<T[number], string | number | boolean>[] {
  if (!Array.isArray(rows)) {
    throw new Error("O retorno do Gemini precisa conter arrays válidos.");
  }

  return rows.map((row) => {
    if (!isPlainObject(row)) {
      throw new Error("Cada item retornado pelo Gemini precisa ser um objeto.");
    }

    const extraColumns = Object.keys(row).filter((key) => !headers.includes(key));
    if (extraColumns.length > 0) {
      throw new Error(`O Gemini retornou colunas extras: ${extraColumns.join(", ")}`);
    }

    const normalized: Record<string, string | number | boolean> = {};

    for (const header of headers) {
      if (header === "weekday") {
        normalized[header] = validateWeekday(row[header]);
        continue;
      }

      normalized[header] = normalizeValue(row[header]);
    }

    return normalized as Record<T[number], string | number | boolean>;
  });
}

function escapeCsvValue(value: string | number | boolean) {
  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv<T extends readonly string[]>(
  headers: T,
  rows: Record<T[number], string | number | boolean>[],
) {
  const csvRows = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header as T[number]])).join(","),
  );

  return [headers.join(","), ...csvRows].join("\n");
}

export const convertDietJsonToCsv = (rows: unknown) => {
  const dietaRows = validateAndNormalizeRows(rows, DIETA_HEADERS);
  return buildCsv(DIETA_HEADERS, dietaRows);
};

export const convertExerciseJsonToCsv = (rows: unknown) => {
  const exerciciosRows = validateAndNormalizeRows(rows, EXERCICIOS_HEADERS);
  return buildCsv(EXERCICIOS_HEADERS, exerciciosRows);
};
