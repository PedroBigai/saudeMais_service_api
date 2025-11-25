import { Request, Response } from "express";
import { loadWeeklyDiet } from "../modules/loadWeeklyDiet";

export const getAlimentosDieta = async (req: Request, res: Response): Promise<any> => {
  try {
    const weekLabel = req.params.weekLabel;
    const userId = Number(req.params.userId); // <-- AQUI!

    console.log("userId recebido:", userId);
    console.log("weekLabel recebido:", weekLabel);

    const data = await loadWeeklyDiet(userId, weekLabel);

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(404).send("Nenhum dado encontrado para o usuário.");
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    return res.status(500).send("Erro no servidor.");
  }
};
