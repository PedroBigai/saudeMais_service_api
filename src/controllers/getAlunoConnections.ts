import { Request, Response } from "express";
import { loadStudentConnection } from "../modules/loadAlunoConnections";

export const getAlunoConnections = async (req: Request, res: Response): Promise<any> => {
  try {
    // const alunoId = (req as any).usuarioId;
    const alunoId = 20
    const loadConnections = await loadStudentConnection(alunoId);
    return res.status(200).json(loadConnections);
  } catch (error) {
    console.error("Erro ao obter conexões do aluno:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }