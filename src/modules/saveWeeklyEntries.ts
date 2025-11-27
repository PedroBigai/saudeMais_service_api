import { WeeklyEntry, Meal, Exercise } from "../interfaces/weeklyEntries";
import pool from "../utils/database"; 

const formatDateToSQL = (date: string | Date): string => {
  const dateStr = date instanceof Date ? date.toISOString() : date;
  return dateStr.split('T')[0];
};

// --- FUNÇÃO QUE CALCULA A SEMANA DO ANO (1-53) ---
const getWeekNumber = (dateInput: string | Date): number => {
  const date = new Date(dateInput);
  // Zera o horário para não dar erro de fuso
  date.setUTCHours(0, 0, 0, 0);
  // ISO 8601: A semana pertence ao ano que contém a Quinta-feira dessa semana
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  // Primeiro dia do ano
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  // Cálculo da diferença de dias / 7
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
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

    const weekly_label = weeklyEntries[0].week_label;
    // Limpar entradas antigas dessa semana específica
    const deleteQuery = `
      DELETE FROM weekly_entries 
      WHERE student_id = ? 
        AND week_label = ?;
    `;
    
    // Passamos o targetWeekLabel calculado
    await connection.execute(deleteQuery, [studentId, weekly_label]);

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

      // --- AQUI GERA O "S-48", "S-49", ETC ---
      const weekNumber = getWeekNumber(entry.week_start_date);
      const newWeekLabel = `S-${weekNumber}`; 
      // ----------------------------------------
      
      // Loop 2: Dias
      for (const dayItem of daysData) { 
        
        let itemsToInsert: (Meal | Exercise)[] = [];
        
        if (entry.entry_type === 'diet' && dayItem.meals) {
            itemsToInsert = dayItem.meals;
        } else if (entry.entry_type === 'exercise' && dayItem.exercises) {
            itemsToInsert = dayItem.exercises;
        }

        // Loop 3: Itens
        for (const actualItem of itemsToInsert) {
            
            let title = actualItem.title;
            if (!title) {
                title = entry.entry_type === 'diet' ? "Refeição sem título" : "Exercício sem título";
            }

            const values = [
              studentId || null,
              professorId || null,
              newWeekLabel, 
              formatDateToSQL(entry.week_start_date),
              formatDateToSQL(entry.week_end_date),
              formatDateToSQL(dayItem.entry_date), // Corrigido: tinha ,, aqui
              dayItem.weekday || null,
              entry.entry_type || null,
              title || null,
              JSON.stringify(actualItem) || null,
              now,
              now
            ];

            await connection.execute(insertQuery, values);
        }
      }
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error("Erro ao salvar as entradas semanais:", error);
    throw error;
  } 
};