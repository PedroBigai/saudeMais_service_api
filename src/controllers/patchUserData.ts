import { Request, Response } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { updateUserPessoalData } from "../modules/updateUserData";

export const updateUserData = async (req: AuthRequest, res: Response):Promise<any> => {
  const { type } = req.params;
  const { valor } = req.body;
  const usuarioId = Number(req.usuarioId);

  if (!type || valor === undefined || usuarioId === undefined) {
    return res.status(400).send("Parâmetros obrigatórios ausentes.");
  }

  try {
    const result = await updateUserPessoalData(usuarioId, type, valor);
    res.status(200).send(result.mensagem);
  } catch (error) {
    console.error("Erro ao atualizar métrica:", error);
    res.status(500).send("Erro no servidor.");
  }
};
