export const createAlimentoRefeicao = async (usuarioId: number, refeicaoData: any) => {
    try {
        const { refeicaoId, alimentoId, quantidade } = refeicaoData;

        // Aqui você deve implementar a lógica para criar o alimento na refeição
        // Isso pode envolver uma chamada ao banco de dados ou outro serviço

        // Exemplo fictício de retorno
        return {
            success: true,
            message: "Alimento adicionado à refeição com sucesso!",
            data: {
                usuarioId,
                refeicaoId,
                alimentoId,
                quantidade,
            },
        };
    } catch (error) {
        console.error("Erro ao criar alimento na refeição:", error);
        return {
            success: false,
            message: "Erro ao criar alimento na refeição.",
        };
    }
}

