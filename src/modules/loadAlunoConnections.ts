import pool from "../utils/database";

export const loadStudentConnection = async (alunoId: number) => {
  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        c.id AS conexao_id,
        c.status,
        c.requested_at,
        c.responded_at,
        c.professor_id,
        u.nome AS professor_nome,
        u.email AS professor_email,
        u.avatar AS professor_avatar,
        u.objetivo AS professor_objetivo,
        u.categoria AS professor_categoria
      FROM user_conexoes c
      JOIN usuarios u ON u.id = c.professor_id
      WHERE c.aluno_id = ?
      ORDER BY c.id DESC
      LIMIT 1;
      `,
      [alunoId]
    );

    if (rows.length === 0) {
      return { 
        linked: false, 
        status: "none", 
        professor: null 
      };
    }

    const c = rows[0];

    return {
      linked: c.status === "accepted",
      status: c.status,
      conexao_id: c.conexao_id,
      professor: {
        id: c.professor_id,
        nome: c.professor_nome,
        email: c.professor_email,
        avatar: c.professor_avatar,
        objetivo: c.professor_objetivo,
        categoria: c.professor_categoria,
      },
      requested_at: c.requested_at,
      responded_at: c.responded_at,
    };
  } catch (err) {
    console.error("Erro ao carregar conexões do aluno:", err);
    return { 
      linked: false, 
      status: "error", 
      professor: null,
      error: "Erro ao buscar conexões do aluno"
    };
  }
};
