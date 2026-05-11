import { Request, Response } from "express";
import { updateMetricsData } from "../modules/updateMetricData";
import { AuthRequest } from "../interfaces/AuthRequest";

export const updateMetricsDataController = async (req: AuthRequest, res: Response):Promise<any> => {
  const typeParam = req.params.type;
  const type = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const { valor } = req.body;
  const usuarioId = Number(req.usuarioId);

  if (!type || valor === undefined || usuarioId === undefined) {
    return res.status(400).send("Parâmetros obrigatórios ausentes.");
  }

  try {
    const result = await updateMetricsData(usuarioId, type, valor);
    res.status(200).send(result.mensagem);
  } catch (error) {
    console.error("Erro ao atualizar métrica:", error);
    res.status(500).send("Erro no servidor.");
  }
};
