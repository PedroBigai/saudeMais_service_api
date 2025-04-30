import { queryAsync } from "./dbService";
import { calcularIMC, calcularMetaCalorica, calcularMetaHidratacao } from "./setUser";

export const updateMetricsTable = async (usuarioId: number) => {
  const agora = new Date();
  const agoraBrasil = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const dataCompletaBrasil = agoraBrasil.toISOString().slice(0, 19).replace("T", " ");
  const dataHoje = dataCompletaBrasil.split(" ")[0];

  const existenteHoje = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = ?",
    [usuarioId, dataHoje]
  );

  if (existenteHoje.length > 0) {
    return { sucesso: false, mensagem: "Já existe métrica registrada para hoje." };
  }

  const ultima = await queryAsync(
    `
    SELECT 
      u.sexo,
      u.objetivo,
      u.data_nascimento AS nascimento,
      m.altura,
      m.peso,
      m.imc,
      m.gordura,
      m.musculo,
      m.agua,
      m.calorias_consumido,
      m.calorias_meta,
      m.hidratacao_consumido,
      m.hidratacao_meta,
      m.streak_caloria,
      m.streak_hidratacao,
      m.medidas_corporais
    FROM metricas m
    LEFT JOIN usuarios u ON u.id = m.usuario_id
    WHERE m.usuario_id = ? AND DATE(m.registrado_em) < ?
    ORDER BY m.registrado_em DESC
    LIMIT 1
    `,
    [usuarioId, dataHoje]
  );

  if (ultima.length > 0) {
    const u = ultima[0];

    const imcNovo = calcularIMC(u.peso, u.altura);
    const metaHidratacaoNovo = calcularMetaHidratacao(u.peso);
    const metaCaloriaNovo = calcularMetaCalorica(u.peso, u.altura, u.sexo, u.objetivo, u.nascimento);

    // calorias: permite consumir até 100 a menos da meta
    let novoStreakCalorias = 0;
    if (u.calorias_consumido != null && u.calorias_meta != null && u.calorias_consumido >= (u.calorias_meta - 100)) {
      novoStreakCalorias = (u.streak_calorias || 0) + 1;
    }

    // hidratacao: também permite até 100 abaixo
    let novoStreakHidratacao = 0;
    if (u.hidratacao_consumido != null && u.hidratacao_meta != null && u.hidratacao_consumido >= (u.hidratacao_meta - 100)) {
      novoStreakHidratacao = (u.streak_hidratacao || 0) + 1;
    }

    await queryAsync(
      `
      INSERT INTO metricas (
        usuario_id, registrado_em,
        altura, peso, imc, gordura, musculo, agua,
        calorias_consumido, calorias_meta,
        hidratacao_consumido, hidratacao_meta,
        medidas_corporais,
        streak_caloria, streak_hidratacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuarioId,
        dataCompletaBrasil,
        u.altura, u.peso, imcNovo, u.gordura, u.musculo, u.agua,
        0,                // calorias_consumido zerado
        metaCaloriaNovo,  // nova meta
        0,                // hidratacao_consumido zerado
        metaHidratacaoNovo,
        u.medidas_corporais,
        novoStreakCalorias,
        novoStreakHidratacao
      ]
    );

    return { sucesso: true, mensagem: "Métricas clonadas com horário registrado e streaks atualizados." };
  }

  return { sucesso: false, mensagem: "Nenhuma métrica anterior encontrada para clonar." };
};
