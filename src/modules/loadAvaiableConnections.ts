import pool from "../utils/database";

export const loadAvailableStudents = async (professorId: number) => {
  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.categoria,
        u.avatar,
        u.objetivo
      FROM usuarios u
      WHERE u.categoria = 'aluno'
        AND u.id NOT IN (
          SELECT aluno_id
          FROM user_conexoes
          WHERE professor_id = ?
        )
      `,
      [professorId]
    );

    return {
      total: rows.length,
      alunosDisponiveis: rows,
    };
  } catch (err) {
    console.error("Erro ao buscar alunos disponíveis:", err);
    return { total: 0, alunosDisponiveis: [], error: "Erro ao buscar alunos" };
  }
};
