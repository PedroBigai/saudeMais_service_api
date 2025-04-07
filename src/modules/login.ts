import jwt from "jsonwebtoken";
import { queryAsync } from "./dbService";
import bcrypt from "bcryptjs";

// Função para realizar o login
export const login = async (email: string, senha: string) => {
  try {
    // Buscar o usuário no banco de dados pelo email
    const result = await queryAsync(
      "SELECT id, email, senha_hash FROM users WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const usuario = result[0];

    // Comparar senha fornecida com o hash armazenado
    const isMatch = await bcrypt.compare(senha, usuario.senha_hash);
    if (!isMatch) {
      throw new Error("Usuário ou senha inválidos.");
    }

    // Gerar o token JWT
    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET || "secreta",
      { expiresIn: "1h" }
    );

    return token;
  } catch (error) {
    throw new Error("Usuário ou senha inválidos. " + error);
  }
};
