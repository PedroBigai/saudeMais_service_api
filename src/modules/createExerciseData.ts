import pool from "../utils/database";

export const createExerciseData = async (usuarioId: number, exerciseData: any) => {
    try {
        const query = `
            INSERT INTO exercicios (usuario_id, tipo, descricao, duracao_minutos, data, criado_em)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            usuarioId,
            exerciseData.tipo,
            JSON.stringify(exerciseData.descricao), // <- aqui
            exerciseData.duracao_minutos,
            exerciseData.data,
            exerciseData.criado_em
        ];

        const [result] = await pool.query(query, values);

        return result;
    } catch (error) {
        console.error("Erro ao criar dados de exercício:", error);
        throw new Error("Erro ao criar dados de exercício.");
    } 
}