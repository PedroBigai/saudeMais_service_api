import { queryAsync } from "./dbService";

export const updateMetricsTable = async () => {
  const hoje = new Date().toISOString().split("T")[0];

  // 1. Pega todos os usuários
  const usuarios = await queryAsync("SELECT id FROM usuarios");

  for (const usuario of usuarios) {
    const usuarioId = usuario.id;

    // 2. Verifica se já existe uma métrica para hoje
    const existenteHoje = await queryAsync(
      "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = ?",
      [usuarioId, hoje]
    );

    if (existenteHoje.length > 0) continue;

    // 3. Pega a última linha registrada ANTES de hoje
    const ultima = await queryAsync(
      `
      SELECT 
        altura, peso, imc, gordura, musculo, agua,
        calorias_consumido, calorias_meta,
        hidratacao_consumido, hidratacao_meta,
         medidas_corporais
      FROM metricas
      WHERE usuario_id = ? AND DATE(registrado_em) < ?
      ORDER BY registrado_em DESC
      LIMIT 1
      `,
      [usuarioId, hoje]
    );

    if (ultima.length > 0) {
      const u = ultima[0];

      await queryAsync(
        `
        INSERT INTO metricas (
          usuario_id, registrado_em,
          altura, peso, imc, gordura, musculo, agua,
          calorias_consumido, calorias_meta,
          hidratacao_consumido, hidratacao_meta, medidas_corporais
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          usuarioId,
          u.altura, u.peso, u.imc, u.gordura, u.musculo, u.agua,
          u.calorias_consumido, u.calorias_meta,
          u.hidratacao_consumido, u.hidratacao_meta,
         u.medidas_corporais
        ]
      );
    }
  }

  return { sucesso: true, mensagem: "Métricas clonadas para o novo dia." };
};
