import { queryAsync } from "./dbService";

interface DadosUsuario {
  nome: string;
  email: string;
  data_nascimento: string;
  sexo: string;
  objetivo: string;
}

interface Metricas {
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
  sono: {
    tempo_descanso: number | null;
    qualidade: string | null;
  };
  dieta: any;
  exercicios: any;
  medidas_corporais: any;
}

export const loadUserData = async (usuarioId: number) => {
  const query = `
    SELECT 
      u.nome, 
      u.email, 
      u.data_nascimento, 
      u.sexo, 
      u.objetivo,

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
      m.sono_tempo_descanso,
      m.sono_qualidade,
      m.dieta,
      m.exercicios,
      m.medidas_corporais

    FROM users u
    LEFT JOIN metricas m ON u.id = m.usuario_id
    WHERE u.id = ?
    ORDER BY m.registrado_em DESC
    LIMIT 1
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
    };

    const metricas: Metricas = {
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
      sono: {
        tempo_descanso: row.sono_tempo_descanso,
        qualidade: row.sono_qualidade,
      },
      dieta: typeof row.dieta === 'string' ? JSON.parse(row.dieta) : row.dieta,
      exercicios: typeof row.exercicios === 'string' ? JSON.parse(row.exercicios) : row.exercicios,
      medidas_corporais:
        typeof row.medidas_corporais === 'string'
          ? JSON.parse(row.medidas_corporais)
          : row.medidas_corporais,
    };

    return {
      dados_usuario,
      metricas,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Erro ao buscar dados do usuário.");
  }
};
