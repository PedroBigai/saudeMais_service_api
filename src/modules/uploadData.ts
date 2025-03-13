import { queryAsync } from "./dbService";

// Função para atualizar ou inserir o peso
export const uploadUserData = async (usuarioId: number, data: string, peso: number, altura?: number) => {
  let alturaAtual = altura;

  // Se não passar altura, pega a última altura registrada
  if (!altura) {
    const alturaRes = await queryAsync("SELECT altura FROM medidas WHERE usuario_id = ? ORDER BY data DESC LIMIT 1", [usuarioId]);
    if (alturaRes.length > 0) alturaAtual = alturaRes[0].altura;
  }

  // Verificar se já existe um registro para o usuário e data
  const registroExistente = await queryAsync("SELECT id FROM medidas WHERE usuario_id = ? AND data = ?", [usuarioId, data]);
  
  if (registroExistente.length > 0) {
    // Atualizar o registro existente
    await queryAsync("UPDATE medidas SET peso = ?, altura = ? WHERE id = ?", [peso, alturaAtual, registroExistente[0].id]);
    return { mensagem: "Peso atualizado com sucesso." };
  }

  // Caso não exista, criar um novo registro
  await queryAsync("INSERT INTO medidas (usuario_id, altura, peso, data) VALUES (?, ?, ?, ?)", [usuarioId, alturaAtual, peso, data]);
  return { mensagem: "Novo registro de peso adicionado." };
};
