// src/types/custom.d.ts
import { Request } from "express";

export interface AuthRequest extends Request {
  usuarioId?: string; // ou number, dependendo do tipo do seu ID
  categoria?: string;
}
