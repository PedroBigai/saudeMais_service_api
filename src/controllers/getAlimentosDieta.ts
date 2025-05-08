import { Request, Response } from "express";
import { loadDietaData } from "../modules/loadDietaData";

export const getAlimentosDieta = async (req: Request, res: Response):Promise <any> => {
    try {
        const data = await loadDietaData();
    
        if (!data) {
        return res.status(404).send("Nenhum dado encontrado para o usuário.");
        }
    
        res.status(200).send(data);
    } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        res.status(500).send("Erro no servidor.");
    }
    }