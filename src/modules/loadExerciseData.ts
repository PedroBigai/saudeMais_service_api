import pool from "../utils/database";

export const loadExerciseData = async (usuarioId: number) => {
    try {
        const query = `
        SELECT * FROM exercicios
        WHERE usuario_id = ?
        `;

        const [rows] = await pool.query(query, [usuarioId]);
        return rows;
    } catch (error) {
        console.error("Erro ao carregar dados de exercícios:", error);
        throw new Error("Erro ao carregar dados de exercícios.");
    }
}