import { queryAsync } from "./dbService";

export const updateMetricsData = async (
  usuarioId: number,
  tipo: string,
  valor: any
) => {
  const hoje = new Date().toISOString().split("T")[0];

  const existente = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = CURDATE()",
    [usuarioId]
  );

  const id = existente.length > 0 ? existente[0].id : null;

  const colunasSimples = [
    "altura",
    "peso",
    "imc",
    "gordura",
    "musculo",
    "agua",
    "calorias_consumido",
    "calorias_meta",
    "hidratacao_consumido",
    "hidratacao_meta",
    "streak_caloria",
    "streak_hidratacao",
  ];

  const colunasJson = [
    "medidas_corporais",
  ];

  if (id) {
    if (colunasSimples.includes(tipo)) {
      await queryAsync(
        `UPDATE metricas SET ${tipo} = ? WHERE id = ?`,
        [valor, id]
      );
    
      if (tipo === "calorias_consumido" || tipo === "hidratacao_consumido") {
        const dados = await queryAsync(
          `SELECT calorias_consumido, calorias_meta, hidratacao_consumido, hidratacao_meta FROM metricas WHERE id = ?`,
          [id]
        );

        const [m] = dados;

        // Data de ontem
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toISOString().split("T")[0];

        // Busca o último registro antes de hoje
        const [anterior] = await queryAsync(
          `SELECT registrado_em, streak_caloria, streak_hidratacao
           FROM metricas
           WHERE usuario_id = ? AND DATE(registrado_em) < CURDATE()
           ORDER BY registrado_em DESC
           LIMIT 1`,
          [usuarioId]
        );

        let streakAnteriorCalorias = 0;
        let streakAnteriorHidratacao = 0;

        const dataAnterior = anterior?.registrado_em?.toISOString?.().split("T")[0] ?? anterior?.registrado_em?.split("T")[0];

        const registroFoiOntem = dataAnterior === dataOntem;

        if (registroFoiOntem) {
          streakAnteriorCalorias = anterior?.streak_caloria || 0;
          streakAnteriorHidratacao = anterior?.streak_hidratacao || 0;
        }

        let novoStreakCalorias = m.calorias_consumido >= (m.calorias_meta - 100)
          ? streakAnteriorCalorias + 1
          : 0;

        let novoStreakHidratacao = m.hidratacao_consumido >= (m.hidratacao_meta - 100)
          ? streakAnteriorHidratacao + 1
          : 0;

        await queryAsync(
          `UPDATE metricas SET streak_caloria = ?, streak_hidratacao = ? WHERE id = ?`,
          [novoStreakCalorias, novoStreakHidratacao, id]
        );
      }
    }else if (colunasJson.includes(tipo)) {
      const resultado = await queryAsync(
        `SELECT ${tipo} FROM metricas WHERE id = ?`,
        [id]
      );

      let valorAntigo = {};

      if (resultado.length > 0 && resultado[0][tipo]) {
        const dadoBruto = resultado[0][tipo];
        try {
          valorAntigo = typeof dadoBruto === 'string'
            ? JSON.parse(dadoBruto)
            : dadoBruto;
        } catch {
          valorAntigo = {};
        }
      }

      const valorAtualizado = {
        ...valorAntigo,
        ...valor
      };

      await queryAsync(
        `UPDATE metricas SET ${tipo} = ? WHERE id = ?`,
        [JSON.stringify(valorAtualizado), id]
      );
    } else {
      return { mensagem: `Tipo de métrica '${tipo}' não reconhecido.` };
    }

    return { mensagem: `Métrica de ${tipo} atualizada.` };
  } else {
    const valorFinal = colunasJson.includes(tipo) ? JSON.stringify(valor) : valor;

    const query = `INSERT INTO metricas (usuario_id, registrado_em, ${tipo}) VALUES (?, NOW(), ?)`;

    await queryAsync(query, [usuarioId, valorFinal]);

    return { mensagem: `Métrica de ${tipo} registrada.` };
  }
};