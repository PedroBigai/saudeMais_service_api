import { Router } from "express";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import verificarToken from "../modules/authService";
import { updateDataController } from "../controllers/patchUserData";
import { cadastrarUser } from "../controllers/postNewUser";
import { getUserData } from "../controllers/getUserData";
import { Request, Response, NextFunction } from "express";


// Fake middleware para testes (substitui o verificarToken)
const mockToken = (req: Request, res: Response, next: NextFunction) => {
    (req as any).usuarioId = 2; // Defina aqui o ID do usuário que quer simular
    next();
};
  

const router = Router();

router.get("/verificar-email/:email", checkUserMail) // FUNCIONANDO
router.post("/cadastro", cadastrarUser); // FUNCIONANDO
router.post("/login", loginController) // FUNCIONANDO

router.get('/dados-usuario', verificarToken, getUserData); // FUNCIONANDO
router.post("/update/:type", verificarToken, updateDataController); // FUNCIONANDO

router.get("/", (req, res) => {
    res.json({ mensagem: "API funcionando corretamente! V1.0.0" });
});

  
export default router;



