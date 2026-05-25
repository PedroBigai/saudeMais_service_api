import { Response } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { generateStudentPlanCsv, GroqRateLimitError } from "../modules/generateStudentPlanCsv";
import { verifyProfessorStudentConnection } from "../modules/verifyProfessorStudentConnection";

type TipoPlano = "dieta" | "exercicios";

export const postGenerateStudentPlanCsv = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const professorId = Number(req.usuarioId);
    const alunoId = Number(req.params.alunoId);

    const { mensagem, tipoPlano } = req.body as {
      mensagem?: string;
      tipoPlano?: TipoPlano;
    };

    if (!professorId) {
      return res.status(400).json({ success: false, message: "ID do professor inválido." });
    }

    if (!alunoId) {
      return res.status(400).json({ success: false, message: "ID do aluno inválido." });
    }

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ success: false, message: "Prompt do professor é obrigatório." });
    }

    const tiposPermitidos: TipoPlano[] = ["dieta", "exercicios"];

    if (!tipoPlano || !tiposPermitidos.includes(tipoPlano)) {
      return res.status(400).json({
        success: false,
        message: "tipoPlano inválido. Use: dieta ou exercicios.",
      });
    }

    const hasConnection = await verifyProfessorStudentConnection(professorId, alunoId);

    if (!hasConnection) {
      return res.status(403).json({
        success: false,
        message: "Professor sem conexão aceita com este aluno.",
      });
    }

    const generatedPlan = await generateStudentPlanCsv({
      alunoId,
      mensagem: mensagem.trim(),
      tipoPlano,
    });

    return res.status(200).json({
      success: true,
      tipoPlano,
      ...generatedPlan,
    });
  } catch (error) {
    console.error("Erro ao gerar plano do aluno em CSV:", error);

    if (error instanceof Error && error.message === "ALUNO_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Aluno não encontrado." });
    }

    if (error instanceof Error && error.message === "GROQ_API_KEY não configurada.") {
      return res.status(503).json({ success: false, message: "Serviço de IA indisponível no momento." });
    }

    if (error instanceof GroqRateLimitError) {
      return res.status(429).json({
        success: false,
        code: error.code,
        message: error.message,
        retryAfterSec: error.retryAfterSec,
        retryAfterHuman: error.retryAfterHuman,
      });
    }

    return res.status(500).json({ success: false, message: "Erro ao gerar arquivos CSV." });
  }
};
