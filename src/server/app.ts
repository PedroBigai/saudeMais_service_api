import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";

dotenv.config();

const app = express();

// ---------- Parsers ----------
app.use(express.json());
app.use(cookieParser());

// ---------- CORS (credenciais + origem específica) ----------
const DEV_ORIGINS = [
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
];
const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // Permite ferramentas sem Origin (curl/Postman) e o próprio backend
    if (!origin) return cb(null, true);
    if (DEV_ORIGINS.includes(origin) || origin.endsWith("danielhatz.com.br")) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true, // necessário para enviar/receber cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token", "Authorization"],
};
app.use(cors(corsOptions));
// (opcional) responde preflight explicitamente
app.options("*", cors(corsOptions));

// ---------- Rotas ----------
app.use(router);

export default app;
