import pool from "../utils/database";

export async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query("SELECT 1");
    console.log("Conexao com o banco validada com sucesso.");
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
    throw error;
  } finally {
    connection?.release();
  }
}
