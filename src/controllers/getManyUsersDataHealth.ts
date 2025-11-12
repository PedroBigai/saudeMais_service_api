import { Request, Response } from "express";
import { loadUsersHealthData } from "../modules/loadManyUsersData";
import pool from "../utils/database";

export const getManyUsersHealthData = async (req: Request, res: Response): Promise<any> => {
  try {
    const professorId = (req as any).usuarioId;
    const alunoIdParam = req.params.id ? Number(req.params.id) : null;

    let userIds: number[] = [];

    if (alunoIdParam) {
      userIds = [alunoIdParam];
    } else {
      const [conexoes]: any = await pool.query(
        "SELECT aluno_id FROM user_conexoes WHERE professor_id = ? AND status = 'accepted'",
        [professorId]
      );

      userIds = conexoes.map((c: any) => c.aluno_id);
    }

    if (!userIds.length) {
      return res.status(200).json({
        success: true,
        message: alunoIdParam
          ? "Aluno não encontrado ou sem dados de saúde."
          : "Nenhum aluno conectado ao professor.",
        total: 0,
        data: [],
      });
    }

    const result = await loadUsersHealthData(userIds);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    console.error("Erro ao carregar dados de saúde dos alunos:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro interno ao carregar dados de saúde." });
  }
};
