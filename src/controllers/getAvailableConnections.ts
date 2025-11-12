import { loadAvailableStudents } from "../modules/loadAvaiableConnections";
import { Request, Response } from "express";

export const getAvailableConnections = async (req: Request, res: Response): Promise<any> => {
    try {
        const professorId = (req as any).usuarioId;
        const loadConnections = await loadAvailableStudents(professorId);
        return res.status(200).json(loadConnections);
    } catch (error) {
        console.error("Erro ao obter conexões disponíveis do professor:", error);
        return res.status(500).json({ mensagem: "Erro ao obter conexões disponíveis do professor." });
    }}
