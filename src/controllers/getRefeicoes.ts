import { AuthRequest } from "../interfaces/AuthRequest";
import { Response } from "express";
import { loadRefeicoesData } from "../modules/loadRefeicoesData";


export const getRefeicoes = async (req: AuthRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const usuarioId = req.usuarioId;

    try {
        const refeicoes = await loadRefeicoesData(id);

        if (!refeicoes) {
            return res.status(404).send("Nenhum dado encontrado para o usuário.");
        }

        res.status(200).send(refeicoes);
    } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        res.status(500).send("Erro no servidor.");
    }
}