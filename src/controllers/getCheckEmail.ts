import { Request, Response } from "express";
import { verifyEmail } from "../modules/verifyEmail";

export const checkUserMail = async (req: Request, res: Response) => {
  try {
    const emailParam = req.params.email;
    const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;

    if (!email) {
      return res.status(400).send("Parâmetros obrigatórios ausentes.");
    }

    const disponivel = await verifyEmail(email);  // Chama o serviço

    if (disponivel) {
      // Email disponível
      res.status(200).send({ disponivel }); // Código 200 OK é mais apropriado para uma resposta bem-sucedida
    } else {
      // Email não disponível
      res.status(409).send({ disponivel }); // Código 409 Conflict indica que o email já está em uso
    }
    
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    res.status(500).send("Erro no servidor.");
  }
};
