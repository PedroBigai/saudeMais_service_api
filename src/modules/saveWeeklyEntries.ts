import { WeeklyEntry, Meal, Exercise } from "../interfaces/weeklyEntries";
import pool from "../utils/database"; 

const formatDateToSQL = (date: string | Date): string => {
  // Se for objeto Date, converte para string ISO
  const dateStr = date instanceof Date ? date.toISOString() : date;
  // Pega apenas a parte da data (2025-11-30) ignorando horas e timezones
  return dateStr.split('T')[0];
};

export const saveWeeklyEntries = async (
  weeklyEntries: WeeklyEntry[], 
  professorId: number, 
  studentId: number
): Promise<void> => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    if (weeklyEntries.length === 0) {
      throw new Error("Nenhuma entrada para salvar.");
    }

    const weekStartDate = weeklyEntries[0].week_start_date;

    // Limpar entradas antigas
    const deleteQuery = `
      DELETE FROM weekly_entries 
      WHERE student_id = ? 
        AND week_start_date = ?;
    `;
    await connection.execute(deleteQuery, [studentId, weekStartDate]);

    console.log("Iniciando inserção de novas entradas...");

    const insertQuery = `
      INSERT INTO weekly_entries (
        student_id, professor_id, week_label, week_start_date, week_end_date, 
        entry_date, weekday, entry_type, title, details, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const now = new Date(); 

    // Loop 1: Semanas
    for (const entry of weeklyEntries) {
      const daysData = entry.data || []; 

      // Loop 2: Dias
      for (const dayItem of daysData) { 
        
        // Define o que vamos inserir (Refeições ou Exercícios)
        let itemsToInsert: (Meal | Exercise)[] = [];
        
        if (entry.entry_type === 'diet' && dayItem.meals) {
            itemsToInsert = dayItem.meals;
        } else if (entry.entry_type === 'exercise' && dayItem.exercises) {
            itemsToInsert = dayItem.exercises;
        }

        // Loop 3: Itens (Refeição ou Exercício específico)
        for (const actualItem of itemsToInsert) {
            
            // Lógica de Título
            let title = actualItem.title;
            if (!title) {
                title = entry.entry_type === 'diet' ? "Refeição sem título" : "Exercício sem título";
            }

            const values = [
              studentId || null,
              professorId || null,
              entry.week_label || null,
              formatDateToSQL(entry.week_start_date), // TRATADO
              formatDateToSQL(entry.week_end_date),   // TRATADO
              formatDateToSQL(dayItem.entry_date),, // Data do dia correto
              dayItem.weekday || null,    // Dia da semana correto
              entry.entry_type || null,
              title || null,              // Título do item específico
              JSON.stringify(actualItem) || null, // JSON do item específico
              now,
              now
            ];

            await connection.execute(insertQuery, values);
        }
      }
    }

    await connection.commit();
    console.log(`Semana de ${weekStartDate} salva com sucesso.`);

  } catch (error) {
    await connection.rollback();
    console.error("Erro ao salvar as entradas semanais:", error);
    throw error;
  } 
};