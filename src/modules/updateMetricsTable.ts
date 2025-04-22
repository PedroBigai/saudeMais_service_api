import { queryAsync } from "./dbService";

// Simulação de cálculo de meta calórica e de hidratação
// Esses cálculos são fictícios – adapte com base na lógica do seu sistema!
function calcularMetaCalorias(peso: number, altura: number, sexo: string, objetivo: number): number {
  // Fórmula genérica simplificada
  const tmb = sexo === "masculino"
    ? 66 + (13.75 * peso) + (5 * altura) - (6.75 * 25) // idade fixada como 25 pra exemplo
    : 655 + (9.56 * peso) + (1.85 * altura) - (4.68 * 25);
  const fatorObjetivo = objetivo === 1 ? 0.8 : objetivo === 2 ? 1.0 : 1.2; // perder, manter, ganhar
  return Math.round(tmb * fatorObjetivo);
}

function calcularMetaHidratacao(peso: number): number {
  return peso * 35; // 35ml por kg
}


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

    const novaCaloriasMeta = calcularMetaCalorias(u.peso, u.altura, "masculino", 2); // você pode buscar sexo e objetivo do usuário no banco
    const novaHidratacaoMeta = calcularMetaHidratacao(u.peso);


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
        u.altura, u.peso, u.imc, u.gordura, u.musculo, u.agua,
        0,               // calorias_consumido zerado
        novaCaloriasMeta,
        0,               // hidratacao_consumido zerado
        novaHidratacaoMeta,
        u.medidas_corporais
      ]
    );    

    return { sucesso: true, mensagem: "Métricas clonadas com horário registrado." };
  }

  return { sucesso: false, mensagem: "Nenhuma métrica anterior encontrada para clonar." };
};