import { Request, Response } from "express";
import { verifyUser } from "../modules/verifyUser";

export const checkUser = async (req: Request, res: Response) => {
  try {
    const { usuario } = req.params;
    const disponivel = await verifyUser(usuario);  // Chama o serviço
    res.status(202).send({ disponivel });
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    res.status(500).send("Erro no servidor.");
  }
};
