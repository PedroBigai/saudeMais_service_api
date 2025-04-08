import app from "./server/app";
import { createTables } from "./modules/createTables"
import cron from "node-cron";
import { updateMetricsTable } from "./modules/updateMetricsTable";

const PORT = process.env.PORT || 3000;

createTables()

// Agendar execução diária às 00:05 da manhã
cron.schedule("05 00 * * *", async () => {
  console.log("🕐 Executando replicação de métricas...");
  try {
    const resultado = await updateMetricsTable();
    console.log("✅", resultado.mensagem);
  } catch (error) {
    console.error("❌ Erro na replicação de métricas:", error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
