import { Request, Response } from "express";
import { loadProfessorConnections } from "../modules/loadProfessorConnections";

export const getProfessorConnections = async (req: Request, res: Response): Promise<any> => {
  try {
    const professorId = (req as any).usuarioId;
    const loadConnections = await loadProfessorConnections(professorId);
    return res.status(200).json(loadConnections);
  } catch (error) {
    console.error("Erro ao obter conexões do professor:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao obter conexões do professor." });
  }
};
