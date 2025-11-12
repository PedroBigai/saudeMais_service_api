import pool from "../utils/database";

export const loadProfessorConnections = async (professorId: number) => {
  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        uc.id,
        uc.aluno_id,
        u.nome,
        u.email,
        uc.status,
        uc.requested_at,
        uc.responded_at,
        uc.requested_by,
        uc.responded_by
      FROM user_conexoes uc
      JOIN usuarios u ON u.id = uc.aluno_id
      WHERE uc.professor_id = ?
      ORDER BY uc.requested_at DESC
      `,
      [professorId]
    );

    // separa por status
    const accepted = rows.filter((r: any) => r.status === "accepted");
    const pending = rows.filter((r: any) => r.status === "pending");
    const rejected = rows.filter((r: any) => r.status === "rejected");

    return {
      accepted,
      pending,
      rejected,
      totals: {
        accepted: accepted.length,
        pending: pending.length,
        rejected: rejected.length,
      },
      hasLinkedStudents: accepted.length > 0,
    };
  } catch (err) {
    console.error("Erro ao buscar conexões:", err);
    return {
      accepted: [],
      pending: [],
      rejected: [],
      totals: {
        accepted: 0,
        pending: 0,
        rejected: 0,
      },
      hasLinkedStudents: false,
      error: "Erro ao buscar conexões",
    };
  }
};
