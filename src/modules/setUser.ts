// src/services/usuarioService.ts
import bcrypt from 'bcrypt';
import { queryAsync } from './dbService';

interface UsuarioRequest {
  usuario: string;
  senha: string;
  email: string;
  altura: number;
  peso: number;
  data: string;
  nascimento: string;
  sexo: string;
  objetivo: string;
}

export const setUser = async ({
  usuario, senha, email, altura, peso, data, nascimento, sexo, objetivo
}: UsuarioRequest) => {
  try {
    // Verificar se o usuário já existe
    const queryUsuario = "SELECT id FROM usuarios WHERE usuario = ?";
    const resultUsuario = await queryAsync(queryUsuario, [usuario]);

    if (resultUsuario.length > 0) {
      return { success: false, message: "Usuário já existe." };
    }

    // Verificar se o e-mail já existe
    const queryEmail = "SELECT id FROM usuarios WHERE email = ?";
    const resultEmail = await queryAsync(queryEmail, [email]);

    if (resultEmail.length > 0) {
      return { success: false, message: "E-mail já cadastrado." };
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir usuário no banco de dados
    const queryCadastro = "INSERT INTO usuarios (usuario, senha, email, data_nascimento, sexo, objetivo) VALUES (?, ?, ?, ?, ?, ?)";
    const resultCadastro = await queryAsync(queryCadastro, [usuario, hashedPassword, email, nascimento, sexo, objetivo]);

    const usuarioId = resultCadastro.insertId;

    // Inserir medidas no banco de dados
    const queryMedidas = "INSERT INTO medidas (usuario_id, altura, peso, data) VALUES (?, ?, ?, ?)";
    await queryAsync(queryMedidas, [usuarioId, altura, peso, data]);

    return { success: true };
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    throw new Error("Erro ao processar o cadastro.");
  }
};
