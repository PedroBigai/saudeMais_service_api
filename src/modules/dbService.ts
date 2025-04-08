import pool from "../utils/database"

export const queryAsync = async (sql: string, params?: any[]) => {
  const [rows] = await pool.execute(sql, params)
  return rows as any[]
}
