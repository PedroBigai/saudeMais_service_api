// src/modules/loadManyUsersData.ts (ou onde estiver)
import pool from "../utils/database";

export const loadUsersHealthData = async (userIds: number[]) => {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        success: true,
        message: "Nenhum usuário solicitado.",
        total: 0,
        data: [],
      };
    }

    const placeholders = userIds.map(() => "?").join(", ");

    const query = `
      SELECT 
        u.id AS usuario_id,
        u.nome,
        u.email,
        u.sexo,
        u.objetivo,
        u.avatar,
        m.peso AS peso_atual,
        m.imc,
        m.medidas_corporais,
        m.calorias_consumido AS calorias_atuais,
        m.calorias_meta,
        m.hidratacao_consumido AS hidratacao_atual,
        m.hidratacao_meta
      FROM usuarios u
      JOIN metricas m 
        ON u.id = m.usuario_id
        AND m.id = (
          SELECT MAX(m2.id)
          FROM metricas m2
          WHERE m2.usuario_id = u.id
        )
      WHERE u.id IN (${placeholders})
      ORDER BY u.id;
    `;

    const [rows]: any = await pool.query(query, userIds);

    // agora já convertemos para o formato do FRONT (DailyMetrics)
    const today = new Date().toISOString().slice(0, 10);

    const data = rows.map((row: any) => ({
      studentId: String(row.usuario_id),
      date: today,
      kcalConsumed: row.calorias_atuais ?? 0,
      kcalGoal: row.calorias_meta ?? 0,
      hydrationLiters: row.hidratacao_atual ?? 0,
      hydrationGoal: row.hidratacao_meta ?? 0,
      weightKg: row.peso_atual ?? 0,
      bmi: row.imc ?? 0,
      extra: {
        nome: row.nome,
        email: row.email,
        sexo: row.sexo,
        objetivo: row.objetivo,
        avatar: row.avatar,
        medidas_corporais: row.medidas_corporais,
      },
    }));

    return {
      success: true,
      message: "Dados carregados com sucesso.",
      total: data.length,
      data,
    };
  } catch (error) {
    console.error("Erro ao carregar dados de múltiplos usuários:", error);
    return {
      success: false,
      message: "Erro ao carregar dados dos usuários.",
      total: 0,
      data: [],
    };
  }
};
