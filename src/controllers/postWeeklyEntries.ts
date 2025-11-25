import { Request, Response } from "express";
import { saveWeeklyEntries } from "../modules/saveWeeklyEntries";

export const postWeeklyEntries = async (req: Request, res: Response): Promise<any> => {
    try {
        const professorId = (req as any).usuarioId;  // ID do professor autenticado
        const alunoId = req.params.userId; // ID do aluno na URL

        const { weeklyEntries } = req.body; // Estrutura recebida

        // Validação para garantir que weeklyEntries não está vazio
        if (!weeklyEntries || weeklyEntries.length === 0) {
            return res.status(400).json({ message: "weeklyEntries deve ser um array não vazio" });
        }

        // Chama a função que salva as entradas semanais no banco
        await saveWeeklyEntries(weeklyEntries, professorId, Number(alunoId));

        // Resposta de sucesso
        return res.status(200).json({ message: "Entradas semanais salvas com sucesso." });

    } catch (error) {
        console.error("Erro ao postar dados semanais:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
};
