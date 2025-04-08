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
    const queryEmail = "SELECT id FROM usuarios WHERE email = ?"
    const resultEmail = await queryAsync(queryEmail, [email])

    if (resultEmail.length > 0) {
      return { success: false, message: "E-mail já cadastrado." }
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Insere usuário
    const insertUser = `
      INSERT INTO usuarios (nome, email, senha_hash, criado_em, sexo, data_nascimento, objetivo)
      VALUES (?, ?, ?, NOW(), ?, ?, ?)
    `
    const insertResult: any = await queryAsync(insertUser, [
      nome,
      email,
      hashedPassword,
      sexo,
      nascimento,
      objetivo
    ])
    const usuarioId = insertResult.insertId

    // Cálculo do IMC
const imc = peso / (altura / 100) ** 2;

// Cálculo da meta de hidratação (35 ml por kg)
const hidratacaoMeta = Math.round(peso * 35);

// Meta calórica simples com base no objetivo
const caloriasMeta =
  objetivo === "1" ? 2200 :
  objetivo === "2" ? 2000 :
  1800;

  const metricas = {
    imc: parseFloat(imc.toFixed(2)),
    gordura: 0,
    musculo: 0,
    agua: 0,
    calorias_consumido: 0,
    calorias_meta: caloriasMeta,
    hidratacao_consumido: 0,
    hidratacao_meta: hidratacaoMeta,
    medidas_corporais: {
      biceps_direito: null,
      biceps_esquerdo: null,
      antebraco_direito: null,
      antebraco_esquerdo: null,
      coxa_direita: null,
      coxa_esquerda: null,
      panturrilha_direita: null,
      panturrilha_esquerda: null,
      cintura: null
    }
  }


    // Insere todas as métricas em uma única linha
    await queryAsync(`
      INSERT INTO metricas (
        usuario_id, altura, peso,
        imc, gordura, musculo, agua,
        calorias_consumido, calorias_meta,
        hidratacao_consumido, hidratacao_meta, medidas_corporais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      usuarioId,
      altura,
      peso,
      metricas.imc,
      metricas.gordura,
      metricas.musculo,
      metricas.agua,
      metricas.calorias_consumido,
      metricas.calorias_meta,
      metricas.hidratacao_consumido,
      metricas.hidratacao_meta,
      JSON.stringify(metricas.medidas_corporais)
    ])

    return { success: true }

  } catch (error) {
    console.error("Erro ao processar cadastro:", error)
    throw new Error("Erro ao processar o cadastro.")
  }
}
