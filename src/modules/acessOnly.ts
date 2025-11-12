// modules/permitirApenas.ts
import { Response, NextFunction } from "express";

export const acessOnly = (tipoPermitido: "professor" | "aluno" | "admin") => {
  return (req: any, res: Response, next: NextFunction) => {
    if (req.categoria !== tipoPermitido) {
      return res.status(403).json({ mensagem: `Acesso permitido apenas a ${tipoPermitido}s.` });
    }
    next();
  };
};
