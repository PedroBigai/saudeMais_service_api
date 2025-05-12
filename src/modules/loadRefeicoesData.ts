export const loadRefeicoesData = async (id: string): Promise<any> => {
    try {

        const refeicoesMock = [
            {
              id: 1,
              nome: "Café da Manhã",
              alimentos: [
                { id: 1, nome: "Aveia", calorias: 150, quantidade: 50, unidade: "g" },
                { id: 2, nome: "Banana", calorias: 90, quantidade: 1, unidade: "unidade" },
                { id: 3, nome: "Leite Desnatado", calorias: 80, quantidade: 200, unidade: "ml" }
              ]
            },
            {
              id: 2,
              nome: "Almoço",
              alimentos: [
                { id: 4, nome: "Arroz Integral", calorias: 200, quantidade: 100, unidade: "g" },
                { id: 5, nome: "Feijão", calorias: 150, quantidade: 100, unidade: "g" },
                { id: 6, nome: "Frango Grelhado", calorias: 250, quantidade: 150, unidade: "g" }
              ]
            },
            {
              id: 3,
              nome: "Jantar",
              alimentos: [
                { id: 7, nome: "Omelete", calorias: 180, quantidade: 2, unidade: "unidade" },
                { id: 8, nome: "Salada", calorias: 50, quantidade: 1, unidade: "prato" }
              ]
            }
          ]

        // const query = `SELECT * FROM refeicoes WHERE id_usuario = ?`;

        // const [rows] = await connection.query(query, [id]);
        // if (rows.length === 0) {
        //     return null;
        // }
        // return rows;
        return refeicoesMock;
    } catch (error) {
        console.error("Erro ao carregar dados de refeições:", error);
        throw new Error("Erro ao carregar dados de refeições");

        }}