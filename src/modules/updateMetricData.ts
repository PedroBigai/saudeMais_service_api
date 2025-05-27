import { queryAsync } from "./dbService";
import { calcularIdade, calcularMetaCalorica, calcularMetaHidratacao } from "./setUser";

export const updateMetricsData = async (
  usuarioId: number,
  tipo: string,
  valor: any
) => {
  const agora = new Date();
  const fusoBrasil = new Date(agora.getTime() - 3 * 60 * 60 * 1000); // UTC-3
  const hoje = fusoBrasil.toISOString().split("T")[0];

  const existente = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = ?",
    [usuarioId, hoje]
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

      if (tipo === "peso" || tipo === "altura") {
        const [dados] = await queryAsync(
          `SELECT peso, altura FROM metricas WHERE id = ?`,
          [id]
        );

        const peso = tipo === "peso" ? valor : dados.peso;
        const altura = tipo === "altura" ? valor : dados.altura;

        if (peso && altura) {
          const imc = +(peso / ((altura / 100) ** 2)).toFixed(2);

          await queryAsync(
            `UPDATE metricas SET imc = ? WHERE id = ?`,
            [imc, id]
          );

          // 🔍 Buscar dados do usuário
          const [usuario] = await queryAsync(
            `SELECT sexo, data_nascimento, objetivo FROM usuarios WHERE id = ?`,
            [usuarioId]
          );

          if (usuario) {
            const { sexo, data_nascimento, objetivo } = usuario;

            const novaMetaCalorica = calcularMetaCalorica(peso, altura, sexo, objetivo, data_nascimento);
            const novaMetaHidratacao = calcularMetaHidratacao(peso);

            await queryAsync(
              `UPDATE metricas SET calorias_meta = ?, hidratacao_meta = ? WHERE id = ?`,
              [novaMetaCalorica, novaMetaHidratacao, id]
            );
          }
        }

      }
    
      if (tipo === "calorias_consumido" || tipo === "hidratacao_consumido") {
        const dados = await queryAsync(
          `SELECT calorias_consumido, calorias_meta, hidratacao_consumido, hidratacao_meta FROM metricas WHERE id = ?`,
          [id]
        );

        const [m] = dados;

        // Data de ontem
        const ontem = new Date(agora.getTime() - 3 * 60 * 60 * 1000); // base na hora do BR
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

        const dentroDaMargem = (consumido: number, meta: number, margem = 100) =>
          meta > 0 && consumido >= (meta - margem) && consumido <= (meta + margem);
        
        let novoStreakCalorias = dentroDaMargem(m.calorias_consumido, m.calorias_meta)
          ? streakAnteriorCalorias + 1
          : 0;
        
        let novoStreakHidratacao = dentroDaMargem(m.hidratacao_consumido, m.hidratacao_meta)
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

        const dataHoraBrasil = new Date(Date.now() - 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // yyyy-mm-dd hh:mm:ss

    const query = `INSERT INTO metricas (usuario_id, registrado_em, ${tipo}) VALUES (?, ?, ?)`;
    await queryAsync(query, [usuarioId, dataHoraBrasil, valorFinal]);


    return { mensagem: `Métrica de ${tipo} registrada.` };
  }
};