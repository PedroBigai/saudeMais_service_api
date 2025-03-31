import { Router } from "express";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import verificarToken from "../modules/authService";
import { updateDataController } from "../controllers/patchUserData";
import pool from "../utils/database";
import { cadastrarUser } from "../controllers/postNewUser";
import { getUserData } from "../controllers/getUserData";

const router = Router();

router.get("/verificar-email/:email", checkUserMail) // FUNCIONANDO
router.post("/cadastro", cadastrarUser); // FUNCIONANDO
router.post("/login", loginController) // FUNCIONANDO

router.get('/dados-usuario', verificarToken, getUserData); // FUNCIONANDO
router.post("/update/:type", verificarToken, updateDataController); // FUNCIONANDO







router.get("/teste", (req, res) => {
    res.json({ mensagem: "API funcionando corretamente! sV1.0.0" });
});

router.get("/users", async (req, res) => {
  try {
    const rows = await pool`SELECT * FROM usuarios`
    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    res.status(500).json({ error: "Erro interno no servidor" })
  }
})

  
export default router;



