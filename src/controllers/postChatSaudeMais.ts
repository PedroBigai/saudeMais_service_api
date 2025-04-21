import { AuthRequest } from "../interfaces/AuthRequest";
import { Request, Response } from "express";
import { loadChatResponse } from "../modules/loadChatResponse";

export const postChatSaudeMais = async (req: AuthRequest, res: Response): Promise<any> => {
    const usuarioId = Number(req.usuarioId);
    const { mensagem } = req.body; 
    
    if (!usuarioId) {
        return res.status(400).send("ID de usuário inválido.");
    }

    if (!mensagem) {
        return res.status(400).send("Mensagem não pode ser vazia.");
    }

    try {
        // Aqui você chamaria a função que processa a mensagem e retorna a resposta do chatbot
        const respostaChatbot = await loadChatResponse(usuarioId, mensagem); // Função fictícia
        
        if (!respostaChatbot) {
            return res.status(404).send("Nenhuma resposta encontrada para a mensagem.");
        }

        res.status(200).send(respostaChatbot);
    } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        res.status(500).send("Erro no servidor.");
    }
}