import pool from "../utils/database";

export const loadDietaData = async () => {
    try {
        const query = `
        SELECT * FROM alimentos_dieta
        `;

        const [rows] = await pool.query(query);

        return rows;

    } catch (error) {
        console.error("Erro ao carregar dados da dieta:", error);
        throw new Error("Erro ao carregar dados da dieta.");
    }
}