import { Router } from "express";
import { checkUser } from "../controllers/getCheckUser";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import { loadUserData } from "../modules/loadUserData";
import verificarToken from "../modules/authService";
import { updateDataController } from "../controllers/patchUserData";

const router = Router();

router.get("/verificar-usuario/:usuario", checkUser);
router.get("/verificar-email/:email", checkUserMail)
router.post("/login", loginController)
router.get('/dados-usuario', verificarToken, loadUserData);
router.post("/atualizar-peso", verificarToken, updateDataController);


export default router;


