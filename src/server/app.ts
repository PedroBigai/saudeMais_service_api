import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes";

dotenv.config();

const app = express();
app.use(express.json());

// Permite conexões de qualquer origem (para testes)
app.use(cors());  // <== Habilita CORS

// Rotas
app.use(router);  // <== Certifique-se de que está chamando suas rotas

app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor rodando na porta 3000");
});

export default app;
