import { queryAsync } from "./dbService";

// Função que verifica se o usuário existe no banco de dados
export const loadUserData = async (usuarioId: number) => {

    const query = `
    SELECT u.usuario, u.email, u.data_nascimento, u.sexo, u.objetivo, 
           m.altura, m.peso, m.biceps_direito, m.biceps_esquerdo, 
           m.antebraco_direito, m.antebraco_esquerdo, m.coxa_direita, 
           m.coxa_esquerda, m.panturilha_direita, m.panturilha_esquerda, 
           m.cintura, m.data AS data_medida
    FROM usuarios u
    JOIN medidas m ON u.id = m.usuario_id
    WHERE u.id = ?
    ORDER BY m.data ASC
  `;

  try {
    const results = await queryAsync(query, [usuarioId]);

    // Se não houver nenhum dado, retorna null
    if (results.length === 0) {
      return null;
    }

    return results; // Retorna os dados encontrados
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Erro ao buscar dados do usuário.");
  }
};
