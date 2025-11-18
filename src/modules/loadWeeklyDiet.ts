import pool from "../utils/database";

export const loadWeeklyDiet = async (studentId: number, weekLabel: string) => {
  try {
    const query = `
      SELECT 
        id,
        entry_date,
        weekday,
        title,
        details
      FROM weekly_entries
      WHERE student_id = ?
        AND week_label = ?
        AND entry_type = 'diet'
      ORDER BY weekday, entry_date, id
    `;

    const [rows] = await pool.query(query, [studentId, weekLabel]);
    return rows;

  } catch (error) {
    console.error("Erro ao carregar dieta semanal:", error);
    throw new Error("Erro ao carregar dieta semanal.");
  }
};
