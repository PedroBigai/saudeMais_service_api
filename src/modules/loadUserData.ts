import { queryAsync } from "./dbService";

interface DadosUsuario {
  nome: string;
  email: string;
  data_nascimento: string;
  sexo: string;
  objetivo: string;
  avatar: string;
}

export interface Metricas {
  registrado_em: string;
  altura: number | null;
  peso: number | null;
  imc: number | null;
  gordura: number | null;
  musculo: number | null;
  agua: number | null;
  calorias: {
    consumido: number;
    meta: number;
  };
  hidratacao: {
    consumido: number;
    meta: number;
  };
  medidas_corporais: any;
  streak_caloria: number
  streak_hidratacao: number
}

export const loadUserData = async (usuarioId: number) => {
  const query = `
    SELECT 
      u.nome, 
      u.email, 
      u.data_nascimento, 
      u.sexo, 
      u.objetivo,
      u.avatar,

      m.registrado_em,
      m.altura,
      m.peso,
      m.imc,
      m.gordura,
      m.musculo,
      m.agua,
      m.calorias_consumido,
      m.calorias_meta,
      m.hidratacao_consumido,
      m.hidratacao_meta,
      m.medidas_corporais,
      m.streak_caloria,
      m.streak_hidratacao

    FROM usuarios u
    LEFT JOIN metricas m ON u.id = m.usuario_id
    WHERE u.id = ?
    ORDER BY m.registrado_em DESC
  `;

  try {
    const results = await queryAsync(query, [usuarioId]);

    if (results.length === 0) return null;

    const row = results[0];

    const dados_usuario: DadosUsuario = {
      nome: row.nome,
      email: row.email,
      data_nascimento: row.data_nascimento,
      sexo: row.sexo,
      objetivo: row.objetivo,
      avatar: row.avatar,
    };

    const metricas: Metricas[] = results.map((row: any) => ({
      registrado_em: row.registrado_em,
      altura: row.altura,
      peso: row.peso,
      imc: row.imc,
      gordura: row.gordura,
      musculo: row.musculo,
      agua: row.agua,
      calorias: {
        consumido: row.calorias_consumido,
        meta: row.calorias_meta,
      },
      hidratacao: {
        consumido: row.hidratacao_consumido,
        meta: row.hidratacao_meta,
      },
      medidas_corporais:
        typeof row.medidas_corporais === "string"
          ? JSON.parse(row.medidas_corporais)
          : row.medidas_corporais,
      streak_caloria: row.streak_caloria,
      streak_hidratacao: row.streak_hidratacao,
    }));
    
    return {
      dados_usuario,
      streak_caloria: row.streak_caloria || 0,
      streak_hidratacao: row.streak_hidratacao || 0,
      metricas,
    };

  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Erro ao buscar dados do usuário.");
  }
};
