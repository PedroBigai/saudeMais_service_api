import { queryAsync } from "./dbService";

export const updateUserPessoalData = async (
  usuarioId: number,
  tipo: string,
  valor: any
) => {
  // Campos válidos da tabela `usuarios`
  const camposUsuarios = [
    "nome",
    "email",
    "sexo",
    "data_nascimento",
    "objetivo",
    "avatar"
  ];

  if (!camposUsuarios.includes(tipo)) {
    return { mensagem: `Campo '${tipo}' não reconhecido na tabela 'usuarios'.` };
  }

  // Atualiza diretamente na tabela usuarios
  await queryAsync(
    `UPDATE usuarios SET ${tipo} = ? WHERE id = ?`,
    [valor, usuarioId]
  );

  return { mensagem: `Campo '${tipo}' atualizado com sucesso.` };
};
