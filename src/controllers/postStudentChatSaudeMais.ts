import { AuthRequest } from "../interfaces/AuthRequest";
import { Response } from "express";
import { loadChatStudentResponse } from "../modules/loadChatStudentResponse";
import {
  getChatSaudeMaisStatus,
  registerChatSaudeMaisAttempt,
} from "../modules/chatSaudeMaisStatus";

export const postStudentChatSaudeMais = async (req: AuthRequest, res: Response): Promise<any> => {
  const usuarioId = Number(req.usuarioId);
  const { mensagem } = req.body;

  if (!usuarioId) return res.status(400).send("ID de usuário inválido.");
  if (!mensagem) return res.status(400).send("Mensagem não pode ser vazia.");

  const chatStatus = getChatSaudeMaisStatus(usuarioId);

  if (!chatStatus.enabled) {
    return res.status(503).json({ text: "Chat indisponível no momento." });
  }

  if (!chatStatus.canSend) {
    const easterEggs = [
      "💸 Ops! Se eu responder mais agora, o Google me manda a fatura! Aguarde um minutinho, por favor. 😅",
      "🤖 Calma aí, humano! Minha API tá quase pedindo aumento... volto em instantes!",
      "📉 Estou me resguardando antes que o Google comece a cobrar por palavra. Tente de novo daqui a pouco!",
      "💰 Mensagens ilimitadas? Só se você pagar a próxima fatura da IA 😅. Espera 1 minutinho!",
      "🧾 Estou pausando para não ultrapassar o plano da Google. Me dá 60 segundinhos!"
    ];

    const respostaAleatoria = easterEggs[Math.floor(Math.random() * easterEggs.length)];

    return res.status(429).json({ text: respostaAleatoria, retryAfterSec: chatStatus.retryAfterSec });
  }

  registerChatSaudeMaisAttempt(usuarioId);

  try {
    const respostaChatbot = await loadChatStudentResponse(usuarioId, mensagem);

    if (!respostaChatbot) {
      return res.status(404).send("Nenhuma resposta encontrada para a mensagem.");
    }

    res.status(200).send(respostaChatbot);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    res.status(500).send("Erro no servidor.");
  }
};
