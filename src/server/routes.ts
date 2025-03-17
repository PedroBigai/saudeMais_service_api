import { Router } from "express";
import { checkUser } from "../controllers/getCheckUser";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import { loadUserData } from "../modules/loadUserData";
import verificarToken from "../modules/authService";
import { updateDataController } from "../controllers/patchUserData";
import { cadastrarUser } from "../controllers/postNewUser";
import pool from "../utils/database";

const router = Router();

router.get("/verificar-usuario/:usuario", checkUser);
router.get("/verificar-email/:email", checkUserMail)
router.post("/login", loginController)
router.get('/dados-usuario', verificarToken, loadUserData);
router.post("/atualizar-peso", verificarToken, updateDataController);
router.post("/cadastro", cadastrarUser);
router.get("/teste", (req, res) => {
    res.json({ mensagem: "API funcionando corretamente! V1.0.0" });
});
router.get("/usuarios", async (req, res) => {
    try {
        // Fazendo o SELECT diretamente dentro da rota
        const [rows, fields] = await pool.execute('SELECT * FROM usuarios');
        
        // Retorna os usuários como JSON
        res.json(rows); 
    } catch (error) {
        console.error('Erro ao consultar usuários:', error);
        res.status(500).json({ mensagem: 'Erro ao consultar usuários', erro: error });
    }
});


export default router;



