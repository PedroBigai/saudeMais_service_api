// src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import { setUser } from '../modules/setUser';

export const cadastrarUsuario = async (req: Request, res: Response) => {
  const { usuario, senha, confirmarSenha, email, altura, peso, data, nascimento, sexo, objetivo } = req.body;

  if (senha !== confirmarSenha) {
    return res.status(400).send("As senhas não coincidem.");
  }

  try {
    const resultado = await setUser({
      usuario, senha, email, altura, peso, data, nascimento, sexo, objetivo
    });
    
    if (resultado.success) {
      return res.status(200).send("Cadastro e medidas salvas com sucesso!");
    } else {
      return res.status(400).send(resultado.message);
    }
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    return res.status(500).send("Erro ao processar o cadastro.");
  }
};
