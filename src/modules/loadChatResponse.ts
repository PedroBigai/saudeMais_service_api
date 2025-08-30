import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { loadUserData } from "./loadUserData";

// API KEY (pode vir de .env também)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBf-CbefdcrB2pzbCWDMC5A4hYS9WpkPus");

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const loadChatResponse = async (userId: number, mensagem: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",    
        generationConfig: {
          maxOutputTokens: 200,
        },
        safetySettings,
      });

         const userData = await loadUserData(userId)
         const finalUserMetricas = userData?.metricas[0]
         
         const finalUserData = {
            dados_usuario: userData?.dados_usuario,
            streak_caloria: userData?.streak_caloria || 0,
            streak_hidratacao: userData?.streak_hidratacao || 0,
            metricas: finalUserMetricas
         }
         const dataAtual = new Date().toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        });
        
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `
                Data atual: ${dataAtual}

                Esses aqui são os dados do usuário:
                ${JSON.stringify(finalUserData, null, 2)}
                const objetivos = {
                  1: "Perca de peso",
                  2: "Ganho de massa",
                  3: "Manutenção do peso"
                };

                Você é um assistente virtual especializado em saúde. 
                Seu papel é responder dúvidas de usuários sobre alimentação saudável, bem-estar, rotina de exercícios, sono, hidratação e outros temas relacionados à saúde de forma clara,
                útil e gentil. 
                Evite dar diagnósticos médicos, mas incentive hábitos saudáveis e, se necessário, recomende que o usuário procure um profissional da saúde.
                Se a pergunta envolver dados pessoais como email ou telefone, informe que não é possível compartilhar essas informações.
                Seja direto e claro nas suas respostas.`,
              },
            ],
          },
          {
            role: "model",
            parts: [{ text: "Claro! Estou aqui para ajudar com informações sobre saúde e bem-estar. 😊" }],
          },
        ],
      });
  
      const result = await chat.sendMessage(mensagem);
      const response = await result.response;
      return JSON.stringify({ text: response.text() }); // 👈 JSON final
    } catch (error) {
      console.error("Erro ao gerar resposta do assistente de saúde:", error);
      return "Desculpe, houve um erro ao gerar a resposta.";
    }}