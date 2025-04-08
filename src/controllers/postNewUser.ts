// src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import { setUser } from '../modules/setUser';

export const cadastrarUser = async (req: Request, res: Response): Promise<any> => {
  const {
    nome,
    senha,
    email,
    altura,
    peso,
    nascimento,
    sexo,
    objetivo
  } = req.body;

  // Verificação básica
  if (!nome || !senha || !email) {
    return res.status(400).send("Campos obrigatórios faltando.");
  }

  try {
    const resultado = await setUser({
      nome,
      senha,
      email,
      altura: Number(altura),
      peso: Number(peso),
      nascimento,
      sexo,
      objetivo
    });

    if (resultado.success) {
      return res.status(200).send("Cadastro e métricas salvas com sucesso!");
    } else {
      return res.status(400).send(resultado.message);
    }
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    return res.status(500).send("Erro ao processar o cadastro.");
  }
};
