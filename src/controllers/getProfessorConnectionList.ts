import { loadProfessorListConnection } from "../modules/loadProfessorListConnection";
import { Request, Response } from "express";

export const getProfessorConnectionsList = async (req: Request, res: Response): Promise<any> => {
  try {
    const professorId = (req as any).usuarioId;

    const rows = (await loadProfessorListConnection(professorId)) as any[];

    return res.json({
      alunos: rows.map((r: any) => ({
        id: r.aluno_id,
        nome: r.aluno_nome,
        email: r.aluno_email,
        status: r.status,
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao carregar conexões" });
  }
};
