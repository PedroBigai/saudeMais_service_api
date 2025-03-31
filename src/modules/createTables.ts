// scripts/initDb.ts
import pool from "../utils/database"

export async function createTables() {
  try {
    // Tabela usuarios
    await pool`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW(),
        sexo TEXT,
        data_nascimento DATE,
        objetivo TEXT
      );
    `

    // Tabela metricas
    await pool`
      CREATE TABLE IF NOT EXISTS metricas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        valor JSONB NOT NULL,
        registrado_em TIMESTAMP DEFAULT NOW()
      );
    `

    console.log("Tabelas criadas com sucesso.")
  } catch (error) {
    console.error("Erro ao criar tabelas:", error)
  }
}
