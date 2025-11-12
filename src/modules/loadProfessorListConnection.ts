import pool from "../utils/database";

export const loadProfessorListConnection = async (professorId: number) => {
  try {
    const query = `
      SELECT 
        uc.id AS conexao_id,
        u.id AS aluno_id,
        u.nome AS aluno_nome,
        u.email AS aluno_email,
        uc.status,
        uc.requested_at,
        uc.responded_at
      FROM user_conexoes uc
      INNER JOIN usuarios u
        ON u.id = uc.aluno_id
      WHERE uc.professor_id = ?
        AND uc.status = 'accepted'
      ORDER BY u.nome ASC
    `;

    const [rows] = await pool.query(query, [professorId]);
    return rows;
  } catch (error) {
    console.error("Erro ao carregar conexões do professor:", error);
    throw new Error("Erro ao carregar conexões do professor.");
  }
};
