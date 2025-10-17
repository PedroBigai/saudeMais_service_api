import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../interfaces/AuthRequest';

const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    // Retorna erro se o token não for encontrado, e termina a execução
    res.status(403).send("Token JWT não encontrado.");
    return; // Não deve retornar um valor, apenas parar a execução.
  }

  // Verifica o token JWT
  jwt.verify(token, process.env.JWT_SECRET || "secreta", (err, decoded) => {
    if (err) {
      // Retorna erro se o token for inválido, e termina a execução
      res.status(403).send("Token inválido.");
      return; // Não deve retornar um valor, apenas parar a execução.
    }

    // Adiciona o usuário ID ao request para ser utilizado nas rotas
    req.usuarioId = (decoded as jwt.JwtPayload).id; // TypeScript precisa de type assertion
    req.categoria = (decoded as jwt.JwtPayload).categoria; // Adiciona a categoria ao request
    next(); // Passa o controle para o próximo middleware ou a rota
  });
};

export default verificarToken;
