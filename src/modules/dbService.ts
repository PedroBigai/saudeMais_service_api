import pool from "../utils/database"

export const queryAsync = async (query: string, params?: any[]): Promise<any> => {
  try {
    const result = await pool.unsafe(query, params)
    return result
  } catch (error) {
    console.error("Erro na query:", error)
    throw error
  }
}
