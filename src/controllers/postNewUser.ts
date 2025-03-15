// src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import { setUser } from '../modules/setUser';

export const cadastrarUser = async (req: Request, res: Response) => {
  const { usuario, senha, confirmarSenha, email, altura, peso, data, nascimento, sexo, objetivo } = req.body;

  if (senha !== confirmarSenha) {
    res.status(400).send("As senhas não coincidem.");
  }

  try {
    const resultado = await setUser({
      usuario, senha, email, altura, peso, data, nascimento, sexo, objetivo
    });
    
    if (resultado.success) {
      res.status(200).send("Cadastro e medidas salvas com sucesso!");
    } else {
      res.status(400).send(resultado.message);
    }
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    res.status(500).send("Erro ao processar o cadastro.");
  }
};
