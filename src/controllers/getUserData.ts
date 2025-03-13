import { Request, Response } from "express";
import { loadUserData } from "../modules/loadUserData";

export const userData = async (req: Request, res: Response) => {
  try {
    const { usuarioId } = req.params;

    const data = await loadUserData(Number(usuarioId));  // Chama o serviç

    if (!data) {
        return res.status(404).send("Nenhum dado encontrado para o usuário.");
      }

    res.status(200).send(data); // Envia todos os registros
} catch (error) {
    console.error("Erro ao verificar usuário:", error);
    res.status(500).send("Erro no servidor.");
  }
};
