import { AuthRequest } from "../interfaces/AuthRequest";
import { Response } from "express";
import { createExerciseData } from "../modules/createExerciseData";

export const postExercise = async (req: AuthRequest, res: Response): Promise<any> => {
    const usuarioId = Number(req.usuarioId);
    const {tipo, descricao, duracao_minutos, data, criado_em} = req.body;

    const exerciseData = {
        tipo: tipo,
        descricao: descricao,
        duracao_minutos: duracao_minutos,
        data: data,
        criado_em: criado_em
    }

    if (!usuarioId) {
        return res.status(400).send("ID de usuário inválido.");
    }
    if (!tipo || !descricao || !duracao_minutos || !data) {
        return res.status(400).send("Dados de exercício inválidos.");
    }

    if (typeof duracao_minutos !== "number") {
        return res.status(400).send("Duração em minutos deve ser um número.");
    }

    if (tipo != 'aerobico' && tipo != 'forca' && tipo != 'mobilidade' && tipo != 'fortalecimento') {
        return res.status(400).send("Tipo de exercício inválido.");
    }
    
    try {
        const response = await createExerciseData(usuarioId, exerciseData)

        if (!response) {
            return res.status(404).send("Erro ao criar dados de exercício.");
        }

        res.status(200).send({message: "Dados de exercício criados com sucesso!", response});
    } catch (error) {
        console.error("Erro ao criar dados de exercício:", error);
        res.status(500).send("Erro no servidor.");
    }
}
