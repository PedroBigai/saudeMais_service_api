import { Router } from "express";
import { checkUserMail } from "../controllers/getCheckEmail";
import { loginController } from "../controllers/postLoginUser";
import verificarToken from "../modules/authService";
import { updateMetricsDataController } from "../controllers/patchMetricsData";
import { cadastrarUser } from "../controllers/postNewUser";
import { getUserData } from "../controllers/getUserData";
import { obterDataAtual } from "../controllers/dateController";
import { Request, Response, NextFunction } from "express";
import { postChatSaudeMais } from "../controllers/postChatSaudeMais";
import { updateUserData } from "../controllers/patchUserData";
import { getAlimentosDieta } from "../controllers/getAlimentosDieta";
import { postExercise } from "../controllers/postExercise";
import { getExercise } from "../modules/getExercise";
import { getRefeicoes } from "../controllers/getRefeicoes";
import { postRefeicaoAlimento } from "../controllers/postRefeicaoAlimento";

// === imports para reset de senha (OTP + sessão de redefinição) ===
import {
  requestPasswordResetController,
  verifyPasswordResetController,
  passwordResetStatusController,
  passwordResetConfirmController,
} from "../controllers/passwordResetController";

// Fake middleware para testes (substitui o verificarToken)
const mockToken = (req: Request, res: Response, next: NextFunction) => {
  (req as any).usuarioId = 9; // Defina aqui o ID do usuário que quer simular
  next();
};

const router = Router();

// === rotas públicas ===
router.get("/verificar-email/:email", checkUserMail); // FUNCIONANDO
router.post("/cadastro", cadastrarUser); // FUNCIONANDO
router.post("/login", loginController); // FUNCIONANDO

// === rotas de recuperação de senha (OTP por e-mail + sessão curta) ===
router.post("/password-reset/request", requestPasswordResetController);
router.post("/password-reset/verify", verifyPasswordResetController);
// novas:
router.get("/password-reset/status", passwordResetStatusController);
router.post("/password-reset/confirm", passwordResetConfirmController);

// === rotas protegidas (precisam de token) ===
router.get("/dados-usuario", verificarToken, getUserData); // FUNCIONANDO
router.get("/data-atual", obterDataAtual); // FUNCIONANDO
router.post("/update/:type", verificarToken, updateMetricsDataController); // FUNCIONANDO
router.post("/updateUserData/:type", verificarToken, updateUserData); // FUNCIONANDO
router.post("/chatSaudeMais", verificarToken, postChatSaudeMais); // FUNCIONANDO

router.get("/alimentos-dieta", getAlimentosDieta); // FUNCIONANDO
router.get("/refeicoes/alimentos", verificarToken, getRefeicoes);
router.post("/refeicoes/alimento", verificarToken, postRefeicaoAlimento);

router.post("/createExercise", verificarToken, postExercise); // FUNCIONANDO
router.get("/getExercises", verificarToken, getExercise); // FUNCIONANDO
// router.put("/update/exercise", verificarToken, putExercise)

// rota de saúde da API
router.get("/", (req, res) => {
  res.json({ mensagem: "API funcionando corretamente! V1.0.0" });
});

export default router;
