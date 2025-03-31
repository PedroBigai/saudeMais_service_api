import { Request, Response } from "express";
import { verifyEmail } from "../modules/verifyEmail";

export const checkUserMail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const disponivel = await verifyEmail(email);  // Chama o serviço
    res.status(202).send({ disponivel });
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    res.status(500).send("Erro no servidor.");
  }
};
