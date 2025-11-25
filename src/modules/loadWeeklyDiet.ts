import pool from "../utils/database";
import { RowDataPacket } from "mysql2"; // Importante para tipagem do retorno do MySQL

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
        AND week_label LIKE ? -- Usando LIKE para evitar erros de espaços/formatação
        AND entry_type = 'diet'
      ORDER BY weekday, entry_date, id
    `;

    // Adicionamos % para flexibilidade na busca do label
    const [rows] = await pool.query<RowDataPacket[]>(query, [studentId, `%${weekLabel}%`]);

    // TRATAMENTO DOS DADOS (O "Pulo do Gato")
    const formattedData = rows.map((row) => {
      
      // 1. Faz o Parse do JSON de details
      let parsedDetails = {};
      try {
        // Se já for objeto, usa ele. Se for string, faz parse.
        parsedDetails = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      } catch (error) {
        console.error(`Erro ao fazer parse do detalhes do ID ${row.id}`, error);
        parsedDetails = {}; // Retorna vazio em caso de erro para não quebrar tudo
      }

      // 2. Monta o objeto final limpo, igual ao "Structure diet.txt"
      return {
        id: row.id,
        entry_date: row.entry_date, // O banco já deve retornar data ISO
        weekday: row.weekday,
        title: row.title,
        details: parsedDetails // Aqui entra o objeto com 'time', 'macros', 'alimentos', etc.
      };
    });

    return formattedData;

  } catch (error) {
    console.error("Erro ao carregar dieta semanal:", error);
    throw new Error("Erro ao carregar dieta semanal.");
  }
};