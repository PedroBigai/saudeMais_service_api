// src/controllers/alunoConnectionController.ts
import { Request, Response } from "express";
import { responseConnectionRequest } from "../modules/responseConnection";

export const postAlunoConnection = async (req: Request, res: Response): Promise<any> => {
  try {
    const alunoId = Number((req as any).usuarioId);
    // const alunoId = 20;
    const { conexao_id } = req.params;
    const { status } = req.body as { status?: "accepted" | "rejected" };

    if (!alunoId || !conexao_id) {
      return res
        .status(400)
        .json({ error: "ID do aluno e ID da conexão são obrigatórios." });
    }

    if (!status || (status !== "accepted" && status !== "rejected")) {
      return res
        .status(400)
        .json({ error: "Status inválido. Use 'accepted' ou 'rejected'." });
    }

    const conexaoIdNum = Number(conexao_id);
    if (Number.isNaN(conexaoIdNum)) {
      return res.status(400).json({ error: "ID da conexão inválido." });
    }

    const result = await responseConnectionRequest(
      conexaoIdNum,
      alunoId,
      alunoId, // responded_by
      status
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao responder conexão:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao responder solicitação de conexão." });
  }
};
