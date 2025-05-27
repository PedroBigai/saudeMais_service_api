import { AuthRequest } from "../interfaces/AuthRequest";
import { Request, Response } from "express";
import { loadChatResponse } from "../modules/loadChatResponse";

// Armazena contagem e timestamp para cada usuário
const limiteUsuarios: Record<number, { timestamps: number[] }> = {};

export const postChatSaudeMais = async (req: AuthRequest, res: Response): Promise<any> => {
  const usuarioId = Number(req.usuarioId);
  const { mensagem } = req.body;

  if (!usuarioId) return res.status(400).send("ID de usuário inválido.");
  if (!mensagem) return res.status(400).send("Mensagem não pode ser vazia.");

  // Verifica e atualiza o controle de limite
  const agora = Date.now();
  const intervalo = 60 * 1000; // 1 minuto
  const maxMensagens = 3;

  // Se o usuário ainda não está no objeto, inicializa
  if (!limiteUsuarios[usuarioId]) {
    limiteUsuarios[usuarioId] = { timestamps: [] };
  }

  // Filtra apenas os timestamps dentro do último minuto
  const timestampsRecentes = limiteUsuarios[usuarioId].timestamps.filter(ts => agora - ts < intervalo);

  if (timestampsRecentes.length >= maxMensagens) {
  const easterEggs = [
    "💸 Ops! Se eu responder mais agora, o Google me manda a fatura! Aguarde um minutinho, por favor. 😅",
    "🤖 Calma aí, humano! Minha API tá quase pedindo aumento... volto em instantes!",
    "📉 Estou me resguardando antes que o Google comece a cobrar por palavra. Tente de novo daqui a pouco!",
    "💰 Mensagens ilimitadas? Só se você pagar a próxima fatura da IA 😅. Espera 1 minutinho!",
    "🧾 Estou pausando para não ultrapassar o plano da Google. Me dá 60 segundinhos!"
  ];

  const respostaAleatoria = easterEggs[Math.floor(Math.random() * easterEggs.length)];

  return res.status(429).json({ text: respostaAleatoria });
}


  // Atualiza os timestamps do usuário com a nova tentativa
  timestampsRecentes.push(agora);
  limiteUsuarios[usuarioId].timestamps = timestampsRecentes;

  try {
    const respostaChatbot = await loadChatResponse(usuarioId, mensagem);

    if (!respostaChatbot) {
      return res.status(404).send("Nenhuma resposta encontrada para a mensagem.");
    }

    res.status(200).send(respostaChatbot);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    res.status(500).send("Erro no servidor.");
  }
};
