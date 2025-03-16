import { Router } from "express";
import { checkUser } from "../controllers/getCheckUser";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import { loadUserData } from "../modules/loadUserData";
import verificarToken from "../modules/authService";
import { updateDataController } from "../controllers/patchUserData";
import { cadastrarUser } from "../controllers/postNewUser";

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

// Rota GET para obter todos os usuários
router.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
            return;
        }
        res.json(results);
    });
});

export default router;



