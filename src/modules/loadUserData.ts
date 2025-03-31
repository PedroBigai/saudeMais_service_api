import { queryAsync } from "./dbService";

interface UsuarioComMetrica {
  nome: string;
  email: string;
  data_nascimento: string;
  sexo: string;
  objetivo: string;
  tipo: string | null;
  valor: string | null;
  registrado_em: string | null;
}

export const loadUserData = async (usuarioId: number) => {
  const query = `
    SELECT 
      u.nome, 
      u.email, 
      u.data_nascimento, 
      u.sexo, 
      u.objetivo, 
      m.tipo, 
      m.valor, 
      m.registrado_em
    FROM usuarios u
    LEFT JOIN metricas m ON u.id = m.usuario_id
    WHERE u.id = $1
    ORDER BY m.registrado_em ASC
  `;

  try {
    const results = await queryAsync(query, [usuarioId]) as UsuarioComMetrica[];

    if (results.length === 0) return null;

    const { nome, email, data_nascimento, sexo, objetivo } = results[0];

    const metricas = results
      .filter((r) => r.tipo && r.valor)
      .map((r) => ({
        tipo: r.tipo!,
        valor: JSON.parse(r.valor!), // converte de JSON string para objeto
        registrado_em: r.registrado_em!,
      }));

    return {
      dados_usuario: { nome, email, data_nascimento, sexo, objetivo },
      metricas,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Erro ao buscar dados do usuário.");
  }
};