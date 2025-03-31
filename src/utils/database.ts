// db.ts
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL as string

const pool = postgres(connectionString, {
  // opções opcionais
  ssl: 'require', // importante para conexão com Supabase em prod
})

export default pool
