import { AuthRequest } from "../interfaces/AuthRequest";
import { Response } from "express";
import { createAlimentoRefeicao } from "../modules/createAlimentoRefeicao";

export const postRefeicaoAlimento = async (req: AuthRequest, res: Response): Promise<any> => {
    const usuarioId = Number(req.usuarioId);
    const { alimentoData } = req.body;

    try {
        const result = await createAlimentoRefeicao(usuarioId, alimentoData);

        if (result.success) {
            return res.status(200).send("Alimento adicionado com sucesso!");
        } else {
            return res.status(400).send(result.message);
        }

    }
    catch (error) {
        console.error("Erro ao adicionar alimento:", error);
        return res.status(500).send("Erro ao adicionar alimento.");
    }
}
