import bcrypt from 'bcrypt'
import { queryAsync } from './dbService'

interface UsuarioRequest {
  nome: string
  senha: string
  email: string
  altura: number
  peso: number
  nascimento: string
  sexo: string
  objetivo: string
}

export const setUser = async ({
  nome, senha, email, altura, peso, nascimento, sexo, objetivo
}: UsuarioRequest) => {
  try {
    // Verifica se o e-mail já existe
    const queryEmail = "SELECT id FROM usuarios WHERE email = $1"
    const resultEmail = await queryAsync(queryEmail, [email])

    if (resultEmail.length > 0) {
      return { success: false, message: "E-mail já cadastrado." }
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Insere usuário com novos campos
    const insertUser = `
      INSERT INTO usuarios (nome, email, senha_hash, criado_em, sexo, data_nascimento, objetivo)
      VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      RETURNING id
    `
    const result = await queryAsync(insertUser, [
      nome,
      email,
      hashedPassword,
      sexo,
      nascimento,
      objetivo
    ])
    const usuarioId = result[0].id

    // Insere métrica de altura
    await queryAsync(
      "INSERT INTO metricas (usuario_id, tipo, valor, registrado_em) VALUES ($1, $2, $3, NOW())",
      [usuarioId, "altura", JSON.stringify({ altura })]
    )

    // Insere métrica de peso
    await queryAsync(
      "INSERT INTO metricas (usuario_id, tipo, valor, registrado_em) VALUES ($1, $2, $3, NOW())",
      [usuarioId, "peso", JSON.stringify({ peso })]
    )

    return { success: true }
  } catch (error) {
    console.error("Erro ao processar cadastro:", error)
    throw new Error("Erro ao processar o cadastro.")
  }
}
