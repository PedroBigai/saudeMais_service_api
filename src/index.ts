import app from "./server/app";
import { createTables } from "./modules/createTables"

const PORT = process.env.PORT || 3000;

createTables()

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
