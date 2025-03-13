import jwt from "jsonwebtoken";
import { queryAsync } from "./dbService";
import bcrypt from 'bcryptjs';  // Substitua bcrypt por bcryptjs

// Função para realizar o login
export const login = async (usuario: string, senha: string) => {
  try {
    // Buscar o usuário no banco de dados
    const result = await queryAsync("SELECT id, usuario, senha FROM usuarios WHERE usuario = ? OR email = ?", [usuario, usuario]);

    if (result.length === 0) {
      throw new Error("Usuário ou senha inválidos.");
    }

    // Comparar a senha fornecida com a senha armazenada no banco
    const isMatch = await bcrypt.compare(senha, result[0].senha);
    if (!isMatch) {
      throw new Error("Usuário ou senha inválidos.");
    }

    // Gerar o token JWT
    const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET || "secreta", { expiresIn: "1h" });
    return token;
  } catch (error) {
    throw new Error("Usuário ou senha inválidos." + error);
  }
};
