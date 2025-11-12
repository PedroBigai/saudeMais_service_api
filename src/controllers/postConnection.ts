import { Request, Response } from "express";
import { createRequestConnection } from "../modules/createRequestConnection";

export const postConnection = async (req: Request, res: Response): Promise<any> => {
  try {
    const professorId = (req as any).usuarioId;
    const { alunoId } = req.params;

    if (!professorId || !alunoId) {
      return res.status(400).json({ error: "IDs de professor e aluno são obrigatórios." });
    }

    const result = await createRequestConnection(
      Number(professorId),
      Number(alunoId),
      Number(professorId)
    );

    // se já existia:
    if (result.alreadyExists) {
      return res.status(200).json(result); // 200 pq não é erro, só aviso
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error("Erro ao criar conexão:", err);
    return res.status(500).json({ error: "Erro interno ao criar solicitação de conexão." });
  }
};
