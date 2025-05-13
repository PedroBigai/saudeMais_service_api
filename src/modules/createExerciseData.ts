import pool from "../utils/database";
import { v4 as uuidv4 } from 'uuid';


export const createExerciseData = async (usuarioId: number, exerciseData: any) => {
  try {
    const dataHoje = exerciseData.data;
    const novoExercicio = {
        ...exerciseData.descricao,
        id: uuidv4()
      };
    const tempo = novoExercicio.tempo || 0;

    // 1. Verifica se já existe exercício registrado nesse dia
    const [existenteRows] = await pool.query<any[]>(
      `SELECT id, descricao, duracao_minutos FROM exercicios WHERE usuario_id = ? AND data = ?`,
      [usuarioId, dataHoje]
    );

    if (existenteRows.length === 0) {
      // 2. Não existe — cria novo
      const query = `
        INSERT INTO exercicios (usuario_id, tipo, descricao, duracao_minutos, data, criado_em)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        usuarioId,
        exerciseData.tipo,
        JSON.stringify([novoExercicio]), // vira array com 1
        tempo,
        exerciseData.data,
        exerciseData.criado_em
      ];

      const [result] = await pool.query(query, values);
      return result;
    } else {
      // 3. Já existe — atualiza
      const existente = existenteRows[0];
      const descricaoAtual = JSON.parse(existente.descricao || "[]");
      const novaDescricao = [...descricaoAtual, novoExercicio];
      const novoDuracaoMinutos = (existente.duracao_minutos || 0) + tempo;

      const updateQuery = `
        UPDATE exercicios
        SET descricao = ?, duracao_minutos = ?
        WHERE id = ?
      `;

      const [updateResult] = await pool.query(updateQuery, [
        JSON.stringify(novaDescricao),
        novoDuracaoMinutos,
        existente.id
      ]);

      return updateResult;
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar dados de exercício:", error);
    throw new Error("Erro ao criar/atualizar dados de exercício.");
  }
};
