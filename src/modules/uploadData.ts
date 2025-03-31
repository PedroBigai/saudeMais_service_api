import { queryAsync } from "./dbService";

export const uploadUserData = async (
  usuarioId: number,
  tipo: string,
  valor: any // número, objeto, string, etc.
) => {
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const valorJson = JSON.stringify(valor);

  const existente = await queryAsync(
    "SELECT id FROM metricas WHERE usuario_id = $1 AND tipo = $2 AND DATE(registrado_em) = $3",
    [usuarioId, tipo, hoje]
  );

  if (existente.length > 0) {
    await queryAsync(
      "UPDATE metricas SET valor = $1 WHERE id = $2",
      [valorJson, existente[0].id]
    );
    return { mensagem: `Métrica de ${tipo} atualizada.` };
  }

  await queryAsync(
    "INSERT INTO metricas (usuario_id, tipo, valor, registrado_em) VALUES ($1, $2, $3, NOW())",
    [usuarioId, tipo, valorJson]
  );

  return { mensagem: `Métrica de ${tipo} registrada.` };
};
