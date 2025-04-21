import { Request, Response } from "express";
import { loadUserData } from "../modules/loadUserData";
import { AuthRequest } from "../interfaces/AuthRequest";
import { updateMetricsTable } from "../modules/updateMetricsTable";

export const getUserData = async (req: AuthRequest, res: Response): Promise<any> => {
  const usuarioId = Number(req.usuarioId);

  if (!usuarioId) {
    return res.status(400).send("ID de usuário inválido.");
  }


  try {
    await updateMetricsTable(usuarioId); // Atualiza a tabela de métricas para o usuário
    const data = await loadUserData(usuarioId);

    if (!data) {
      return res.status(404).send("Nenhum dado encontrado para o usuário.");
    }

    res.status(200).send(data);
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    res.status(500).send("Erro no servidor.");
  }
};