import { Request, Response } from "express";
import { login } from "../modules/login";

// Controlador para realizar o login
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const token = await login(email, senha);  // Chama o serviço de login
    res.status(200).json({ token });
  } catch (error) {
    if (error instanceof Error) {
        // Agora você pode acessar 'error.message' e 'error.stack'
        console.error("Erro:", error.message);
        res.status(500).send("Erro no servidor.");
        }
    }
}