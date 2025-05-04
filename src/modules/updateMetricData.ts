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
    } else if (colunasJson.includes(tipo)) {
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