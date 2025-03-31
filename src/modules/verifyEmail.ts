import { queryAsync } from "./dbService";

export const verifyEmail = async (email: string) => {
  try {
    const result = await queryAsync("SELECT email FROM usuarios WHERE email = $1", [email]);
    return result.length === 0;  
  } catch (error) {
    throw new Error("Erro ao verificar email");
  }
};
