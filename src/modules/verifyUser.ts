import { queryAsync } from "./dbService";

// Função que verifica se o usuário existe no banco de dados
export const verifyUser = async (usuario: string) => {
  try {
    const result = await queryAsync("SELECT id FROM usuarios WHERE usuario = ?", [usuario]);
    return result.length === 0;  // Retorna true se o usuário estiver disponível
  } catch (error) {
    throw new Error("Erro ao verificar usuário");
  }
};
