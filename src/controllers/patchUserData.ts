import { Request, Response } from "express";
import { uploadUserData } from "../modules/uploadData";
import { AuthRequest } from "../interfaces/AuthRequest";

export const updateDataController = async (req: AuthRequest, res: Response):Promise<any> => {
  const { type } = req.params;
  const { valor } = req.body;
  const usuarioId = Number(req.usuarioId);

  if (!type || !valor || !usuarioId) {
    return res.status(400).send("Parâmetros obrigatórios ausentes.");
  }

  try {
    const result = await uploadUserData(usuarioId, type, valor);
    res.status(200).send(result.mensagem);
  } catch (error) {
    console.error("Erro ao atualizar métrica:", error);
    res.status(500).send("Erro no servidor.");
  }
};
