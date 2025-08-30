import { queryAsync } from "./dbService";
import bcrypt from "bcryptjs";

export async function getUserIdByEmail(email: string): Promise<number | null> {
  const rows: Array<{ id: number }> = await queryAsync(
    "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
    [email]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0].id ?? null;
}


export async function updateUserPassword(userId: number, novaSenha: string): Promise<boolean> {
  const hash = await bcrypt.hash(novaSenha, 10);

  const sql = `
    UPDATE usuarios
       SET senha_hash = ?
     WHERE id = ?
  `;

  // NÃO desestruture em array; queryAsync retorna um objeto (OkPacket/ResultSetHeader)
  const result: any = await queryAsync(sql, [hash, userId]);

  // mysql2 retorna { affectedRows, changedRows, … } em UPDATE
  return !!result && typeof result.affectedRows === "number" && result.affectedRows > 0;
}