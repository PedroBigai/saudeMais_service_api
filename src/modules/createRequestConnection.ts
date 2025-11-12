import pool from "../utils/database";

export const createRequestConnection = async (
  professorId: number,
  alunoId: number,
  requestedBy: number
) => {
  try {
    const checkQuery = `
      SELECT id, status
      FROM user_conexoes
      WHERE professor_id = ? 
        AND aluno_id = ?
        AND status = 'pending'
      LIMIT 1
    `;
    const [rows]: any = await pool.query(checkQuery, [professorId, alunoId]);

    if (rows.length > 0) {
      return {
        success: false,
        alreadyExists: true,
        message: "Já existe uma solicitação de conexão pendente para este aluno.",
      };
    }

    const insertQuery = `
      INSERT INTO user_conexoes 
        (professor_id, aluno_id, status, requested_by, requested_at)
      VALUES (?, ?, 'pending', ?, NOW())
    `;

    const [result]: any = await pool.query(insertQuery, [
      professorId,
      alunoId,
      requestedBy,
    ]);

    return {
      success: true,
      message: "Solicitação de conexão criada com sucesso!",
      insertId: result.insertId,
    };
  } catch (error) {
    console.error("Erro ao criar solicitação de conexão:", error);
    throw new Error("Erro ao criar solicitação de conexão.");
  }
};
