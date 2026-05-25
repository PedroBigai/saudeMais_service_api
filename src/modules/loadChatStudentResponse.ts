import { GoogleGenAI } from "@google/genai";
import { loadUserData } from "./loadUserData";

export const loadChatStudentResponse = async (
  userId: number,
  mensagem: string
): Promise<{ text: string }> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        text: "Chat indisponível no momento.",
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const userData = await loadUserData(userId);

    const finalUserMetricas =
      userData?.metricas && userData.metricas.length > 0
        ? userData.metricas[0]
        : undefined;

    const finalUserData = {
      dados_usuario: userData?.dados_usuario,
      streak_caloria: userData?.streak_caloria || 0,
      streak_hidratacao: userData?.streak_hidratacao || 0,
      metricas: finalUserMetricas,
    };

    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const prompt = `
Data atual: ${dataAtual}

Dados do usuário:
${JSON.stringify(finalUserData, null, 2)}

Objetivos:
1 = Perda de peso
2 = Ganho de massa
3 = Manutenção do peso

Você é um assistente virtual especializado em saúde.

Responda dúvidas sobre alimentação saudável, bem-estar, rotina de exercícios, sono e hidratação.

Regras:
- Não dê diagnósticos médicos.
- Não prescreva tratamentos.
- Recomende procurar um profissional da saúde quando necessário.
- Não compartilhe dados sensíveis como email, telefone ou documentos.
- Seja direto, claro e gentil.

Mensagem do usuário:
${mensagem}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 500,
      },
    });

    return {
      text: response.text || "Não consegui gerar uma resposta.",
    };
  } catch (error) {
    console.error("Erro ao gerar resposta do assistente de saúde:", error);

    return {
      text: "Desculpe, houve um erro ao gerar a resposta.",
    };
  }
};
