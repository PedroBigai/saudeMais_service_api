import { AuthRequest } from "../interfaces/AuthRequest";
import { Response } from "express";
import { loadExerciseData } from "../modules/loadExerciseData";

export const getExercise = async (req: AuthRequest, res: Response): Promise<any> => {
    const usuarioId = Number(req.usuarioId);

    if (!usuarioId) {
        return res.status(400).send("ID de usuário inválido.");
    }

    try {
        const data = await loadExerciseData(usuarioId); // Função para carregar os dados de exercícios do usuário

        if (!data) {
            return res.status(404).send("Nenhum dado encontrado para o usuário.");
        }

        res.status(200).send(data);
    } catch (error) {
        console.error("Erro ao carregar dados de exercícios:", error);
        res.status(500).send("Erro no servidor.");
    }

} 