// src/modules/responseConnection.ts
import pool from "../utils/database";

export const responseConnectionRequest = async (
  conexaoId: number,
  alunoId: number,
  respondedBy: number,
  status: "accepted" | "rejected"
) => {
  try {
    // 1. Busca a conexão pelo ID e garante que é do aluno logado
    const selectQuery = `
      SELECT id, status, professor_id, aluno_id
      FROM user_conexoes
      WHERE id = ?
        AND aluno_id = ?
      LIMIT 1
    `;

    const [rows]: any = await pool.query(selectQuery, [conexaoId, alunoId]);

    if (rows.length === 0) {
      return {
        success: false,
        notFound: true,
        message: "Nenhuma solicitação de conexão encontrada para este aluno.",
      };
    }

    const conexao = rows[0];

    if (conexao.status === "accepted" || conexao.status === "rejected") {
      return {
        success: false,
        alreadyHandled: true,
        message: `Esta conexão já foi ${conexao.status}.`,
      };
    }

    if (conexao.status !== "pending") {
      return {
        success: false,
        invalidStatus: true,
        message: `Não é possível responder uma conexão com status: ${conexao.status}.`,
      };
    }

    // 2. Atualiza para accepted ou rejected
    const updateQuery = `
      UPDATE user_conexoes
      SET status = ?,
          responded_by = ?,
          responded_at = NOW()
      WHERE id = ?
    `;

    await pool.query(updateQuery, [status, respondedBy, conexao.id]);

    return {
      success: true,
      message:
        status === "accepted"
          ? "Solicitação de conexão aceita com sucesso!"
          : "Solicitação de conexão rejeitada com sucesso!",
      connectionId: conexao.id,
      professorId: conexao.professor_id,
      alunoId: conexao.aluno_id,
      status,
    };
  } catch (error) {
    console.error("Erro ao responder solicitação de conexão:", error);
    return {
      success: false,
      message: "Erro ao responder solicitação de conexão.",
    };
  }
};
