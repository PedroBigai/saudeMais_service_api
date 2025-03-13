import pool from "../utils/database";

// Função para executar consultas SQL de forma assíncrona
export const queryAsync = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error("Erro na query:", error);
    throw error; // Propaga o erro para quem chamar a função
  }
};
