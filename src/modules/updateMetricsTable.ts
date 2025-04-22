import { queryAsync } from "./dbService";
import { calcularIMC, calcularMetaCalorica, calcularMetaHidratacao } from "./setUser";

export const updateMetricsTable = async (usuarioId: number) => {
  // Agora no fuso horário do Brasil (UTC-3)
  const agora = new Date();
  const agoraBrasil = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

  const dataCompletaBrasil = agoraBrasil.toISOString().slice(0, 19).replace("T", " "); // "YYYY-MM-DD HH:MM:SS"
  const dataHoje = dataCompletaBrasil.split(" ")[0]; // Só a parte da data "YYYY-MM-DD"

  // Verifica se JÁ EXISTE ALGUM registro para o mesmo dia (independente do horário)
  const existenteHoje = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = ?",
    [usuarioId, dataHoje]
  );

  // Se já existe, então **não cria de novo**
  if (existenteHoje.length > 0) {
    return { sucesso: false, mensagem: "Já existe métrica registrada para hoje." };
  }

  // Busca o último registro anterior ao dia atual
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
    [usuarioId, dataHoje]
  );

  if (ultima.length > 0) {
    const u = ultima[0];

    const imcNovo = calcularIMC(u.peso, u.altura); // Recalcula o IMC com os dados mais recentes  
    const metaHidratacaoNovo = calcularMetaHidratacao(u.peso); // Recalcula a meta de hidratação com os dados mais recentes 
    const metaCaloriaNovo = calcularMetaCalorica(u.peso, u.altura, u.sexo, u.objetivo, u.nascimento); // Recalcula a meta calórica com os dados mais recentes

    await queryAsync(
      `
      INSERT INTO metricas (
        usuario_id, registrado_em,
        altura, peso, imc, gordura, musculo, agua,
        calorias_consumido, calorias_meta,
        hidratacao_consumido, hidratacao_meta, medidas_corporais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuarioId,
        dataCompletaBrasil, // agora com horário
        u.altura, u.peso, imcNovo, u.gordura, u.musculo, u.agua,
        0,               // calorias_consumido zerado
        metaCaloriaNovo, // nova meta calórica
        0,               // hidratacao_consumido zerado
        metaHidratacaoNovo,
        u.medidas_corporais
      ]
    );    

    return { sucesso: true, mensagem: "Métricas clonadas com horário registrado." };
  }

  return { sucesso: false, mensagem: "Nenhuma métrica anterior encontrada para clonar." };
};

