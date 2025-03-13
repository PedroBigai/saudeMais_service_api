import { Request, Response } from "express";
import { uploadUserData } from "../modules/uploadData";

// Controlador para a rota de atualização de peso
export const updateDataController = async (req: Request, res: Response) => {
  const { data, peso, altura, usuarioId } = req.body;

  try {
    // Chama o serviço para atualizar o peso
    const result = await uploadUserData(usuarioId, data, peso, altura);

    // Envia a resposta com a mensagem do serviço
    res.status(200).send(result.mensagem);
  } catch (error) {
    console.error("Erro ao atualizar peso:", error);
    res.status(500).send("Erro no servidor.");
  }
};
