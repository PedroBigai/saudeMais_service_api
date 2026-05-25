import { readFile } from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.resolve(process.cwd(), "src/data/templates");
type TipoPlanoTemplate = "dieta" | "exercicios";

function parseTemplate(content: string) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);

  return {
    content,
    headers: lines[0]?.split(",") || [],
    sampleLines: lines.slice(0, 6).join("\n"),
  };
}

export const loadPlanCsvTemplate = async (tipoPlano: TipoPlanoTemplate) => {
  const fileName = tipoPlano === "dieta" ? "modelo_dieta.csv" : "modelo_exercicios.csv";
  const content = await readFile(path.join(TEMPLATE_DIR, fileName), "utf-8");

  return parseTemplate(content);
};
