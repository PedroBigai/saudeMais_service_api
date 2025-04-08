import { queryAsync } from "./dbService";

export const uploadUserData = async (
  usuarioId: number,
  tipo: string,
  valor: any
) => {
  const hoje = new Date().toISOString().split("T")[0];

  // Verifica se já existe uma linha de métricas hoje
  const existente = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = ? AND DATE(registrado_em) = ?",
    [usuarioId, hoje]
  );

  const id = existente.length > 0 ? existente[0].id : null;

  // mapeia os tipos diretamente para colunas
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
    // UPDATE
    if (colunasSimples.includes(tipo)) {
      await queryAsync(
        `UPDATE metricas SET ${tipo} = ? WHERE id = ?`,
        [valor, id]
      );
    } else if (colunasJson.includes(tipo)) {
      await queryAsync(
        `UPDATE metricas SET ${tipo} = ? WHERE id = ?`,
        [JSON.stringify(valor), id]
      );
    } else {
      return { mensagem: `Tipo de métrica '${tipo}' não reconhecido.` };
    }

    return { mensagem: `Métrica de ${tipo} atualizada.` };
  } else {
    // INSERT novo com apenas essa métrica preenchida
    let query = `INSERT INTO metricas (usuario_id, registrado_em, ${tipo}) VALUES (?, NOW(), ?)`;
    const valorFinal = colunasJson.includes(tipo) ? JSON.stringify(valor) : valor;

    await queryAsync(query, [usuarioId, valorFinal]);

    return { mensagem: `Métrica de ${tipo} registrada.` };
  }
};
