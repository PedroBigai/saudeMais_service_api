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

export function calcularIMC(peso: number, altura: number): number {
  return parseFloat((peso / (altura / 100) ** 2).toFixed(2));
}

export function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade;
}

export function calcularMetaCalorica(
  peso: number,
  altura: number,
  sexo: string,
  objetivo: string,
  nascimento: string
): number {
  const idade = calcularIdade(nascimento);

  const tmb = sexo === "masculino"
    ? 66 + (13.75 * peso) + (5 * altura) - (6.75 * idade)
    : 655 + (9.56 * peso) + (1.85 * altura) - (4.68 * idade);

  const fatorObjetivo = objetivo === "1" ? 0.8 : objetivo === "2" ? 1.2 : 1.0;

  return Math.round(tmb * fatorObjetivo);
}

export function calcularMetaHidratacao(peso: number): number {
  return Math.round(peso * 35); // 35 ml por kg
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

    const imc = calcularIMC(peso, altura);
    const hidratacaoMeta = calcularMetaHidratacao(peso);
    const caloriasMeta = calcularMetaCalorica(peso, altura, sexo, objetivo, nascimento);   

    const metricas = {
      imc: parseFloat(imc.toFixed(2)),
      gordura: 0,
      musculo: 0,
      agua: 0,
      streak_calorias: 0,
      streak_hidratacao: 0,
      calorias_consumido: 0,
      calorias_meta: caloriasMeta,
      hidratacao_consumido: 0,
      hidratacao_meta: hidratacaoMeta,
      medidas_corporais: {
        biceps_direito: 0,
        biceps_esquerdo: 0,
        antebraco_direito: 0,
        antebraco_esquerdo: 0,
        coxa_direita: 0,
        coxa_esquerda: 0,
        panturrilha_direita: 0,
        panturrilha_esquerda: 0,
        cintura: 0
      }
    }


    // Insere todas as métricas em uma única linha
    await queryAsync(`
      INSERT INTO metricas (
        usuario_id, altura, peso,
        imc, gordura, musculo, agua,
        calorias_consumido, calorias_meta,
        hidratacao_consumido, hidratacao_meta, medidas_corporais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      usuarioId,
      altura,
      peso,
      metricas.imc,
      metricas.gordura,
      metricas.musculo,
      metricas.agua,
      0, // streak_calorias
      0, // streak_hidratacao
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
