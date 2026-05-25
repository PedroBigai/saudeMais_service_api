import { Response } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { getChatSaudeMaisStatus } from "../modules/chatSaudeMaisStatus";

export const getChatSaudeMaisStatusController = (req: AuthRequest, res: Response) => {
  const usuarioId = Number(req.usuarioId);

  if (!usuarioId) {
    return res.status(400).send("ID de usuário inválido.");
  }

  return res.status(200).json(getChatSaudeMaisStatus(usuarioId));
};
