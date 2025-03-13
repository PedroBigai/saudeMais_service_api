import express from "express";
import dotenv from "dotenv";
import router from "./routes";
import "../server/database/database";

dotenv.config();

const app = express();
app.use(express.json());

// Rotas
app.use("/api/users", router);

export default app;
