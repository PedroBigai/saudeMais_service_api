import { Request, Response } from "express";
import { getDataAtualISO } from "../utils/date";

export const obterDataAtual = (req: Request, res: Response) => {
  const data = getDataAtualISO();
  res.json({ data });
};