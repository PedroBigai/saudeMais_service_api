import { Request, Response } from "express";
import { loadUserData } from "../modules/loadUserData";
import { AuthRequest } from "../interfaces/AuthRequest";
import { updateMetricsTable } from "../modules/updateMetricsTable";

export const getUserData = async (req: AuthRequest, res: Response): Promise<any> => {
  const usuarioId = Number(req.usuarioId);
  const categoria = req.categoria as string;

  if (!usuarioId) {
    return res.status(400).send("ID de usuário inválido.");
  }


  try {
    if (categoria === "professor") {
      const data = await loadUserData(usuarioId, categoria);
      if (!data) {
        return res.status(404).send("Nenhum dado encontrado para o usuário.");
      }
      return res.status(200).send(data);
    }
    await updateMetricsTable(usuarioId); // Atualiza a tabela de métricas para o usuário
    const data = await loadUserData(usuarioId);

    if (!data) {
      return res.status(404).send("Nenhum dado encontrado para o usuário.");
    }

    return res.status(200).send(data);
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    return res.status(500).send("Erro no servidor.");
  }
};