// src/controllers/postNewUser.ts
import { Request, Response } from 'express';
import { setUser } from '../modules/setUser';
import { validateCadastroPayload } from '../utils/validators';

export const cadastrarUser = async (req: Request, res: Response): Promise<any> => {
  const check = validateCadastroPayload(req.body);

  if (!check.ok || !check.data) {
    // 400 + mapa de erros por campo
    return res.status(400).json({ success: false, errors: check.errors });
  }

  try {
    const resultado = await setUser(check.data);

    if (resultado.success) {
      return res.status(200).json({ success: true, message: "Cadastro e métricas salvas com sucesso!" });
    } else {
      // Pode vir "E-mail já cadastrado."
      return res.status(400).json({ success: false, message: resultado.message });
    }
  } catch (error) {
    console.error("Erro ao processar cadastro:", error);
    return res.status(500).json({ success: false, message: "Erro ao processar o cadastro." });
  }
};