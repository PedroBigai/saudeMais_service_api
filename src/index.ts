import app from "./server/app";
import { createTables } from "./modules/createTables";
import { testDatabaseConnection } from "./modules/testDatabaseConnection";

const PORT = 3000;
const HOST = "0.0.0.0";

async function startServer() {
  try {
    await testDatabaseConnection();
    await createTables();

    app.listen(PORT, HOST, () => {
      console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
}

startServer();
