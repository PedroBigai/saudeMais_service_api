// scripts/initDb.ts
import pool from "../utils/database"

export async function createTables() {
  try {
    // Tabela usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sexo VARCHAR(50),
        data_nascimento DATE,
        objetivo TINYINT,
        CHECK (objetivo IN (1, 2, 3))
      );
    `)

    // Tabela metricas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metricas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      altura FLOAT,
      peso FLOAT,

      imc FLOAT,
      gordura FLOAT,
      musculo FLOAT,
      agua FLOAT,

      medidas_corporais JSON DEFAULT (
        '{
          "biceps_direito": null,
          "biceps_esquerdo": null,
          "antebraco_direito": null,
          "antebraco_esquerdo": null,
          "coxa_direita": null,
          "coxa_esquerda": null,
          "panturrilha_direita": null,
          "panturrilha_esquerda": null,
          "cintura": null
        }'
      ),

      calorias_consumido INT,
      calorias_meta INT,
      hidratacao_consumido INT,
      hidratacao_meta INT,

      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
    `)

    console.log("Tabelas criadas com sucesso.")
  } catch (error) {
    console.error("Erro ao criar tabelas:", error)
  }
}
