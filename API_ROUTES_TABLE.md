# SaudeMais — Tabela de Endpoints (detalhada)

Documento gerado automaticamente lendo os `controllers` e `modules` para extrair formatos de request e response.

Observação: "Auth" indica se o `Authorization: Bearer <token>` é necessário.

---

## Resumo rápido das estruturas reutilizadas

- Cadastro (payload de `POST /cadastro` - validado em `src/utils/validators.ts` e processado em `src/modules/setUser.ts`):
  - nome (string)
  - email (string)
  - senha (string)
  - altura (number, cm)
  - peso (number, kg)
  - nascimento (string, YYYY-MM-DD)
  - sexo ("masculino" | "feminino")
  - objetivo ("1" | "2" | "3")

- Login: { email, senha } -> retorna { token: string } (JWT)

- Exercise (criar):
  - tipo: enum ["aerobico","forca","mobilidade","fortalecimento"]
  - descricao: string | object (no módulo é armazenado JSON com lista de descrições)
  - duracao_minutos: integer (opcional)
  - data: string (date ou date-time)
  - criado_em: string (date-time opcional)

- Update metric/user data endpoints: body { valor }

- Refeição / alimento: body { alimentoData } — estrutura livre (ver `src/modules/createAlimentoRefeicao.ts`) contendo pelo menos { refeicaoId, alimentoId, quantidade }

---

## Tabela de rotas

| Método | Rota | Auth | Body / Query / Params | Resposta (exemplo / forma) | Códigos relevantes | Notas |
|---|---:|:---:|---|---|---:|---|
| GET | / | ❌ | --- | { mensagem: string } | 200 | Health check |
| GET | /verificar-email/:email | ❌ | params: email | { disponivel: true } ou { disponivel: false } | 200 (disponível), 409 (ocupado), 500 | Implementação em `src/controllers/getCheckEmail.ts` + `src/modules/verifyEmail.ts` |
| POST | /cadastro | ❌ | body: cadastro (ver resumo) | 200 { success: true, message } ou 400 { success:false, errors } | 200, 400, 500 | Validação em `src/utils/validators.ts`, criação em `src/modules/setUser.ts` |
| POST | /login | ❌ | body: { email, senha } | 200 { token: string } ou 401 "Credenciais inválidas." | 200, 401, 500 | Token gerado em `src/modules/login.ts` (JWT 1h) |
| POST | /password-reset/request | ❌ | body: { email } | 200 { ok:true, expiresInSec } ou 429/400 | 200, 429, 400, 500 | Serviço em `src/modules/passwordReset.ts` (limites) |
| POST | /password-reset/verify | ❌ | body: { email, token } | 200 { ok:true } + cookies: `pr_session` (HttpOnly JWT curto), `pr_csrf` (cookie legível) | 200, 400, 500 | Controlador: `src/controllers/passwordResetController.ts` |
| GET | /password-reset/status | ❌ | cookies: pr_session optionally | 200 { ok:true, csrf } ou 401 | 200, 401, 500 | Retorna/renova `pr_csrf` se sessão válida |
| POST | /password-reset/confirm | ❌ (usa cookies) | headers: X-CSRF-Token; cookies: pr_session/pr_csrf; body: { novaSenha } | 200 { ok:true } ou 400/401/403 | 200, 400, 401, 403, 500 | Valida senha (`validateNewPassword`) e faz update via `updateUserPassword` (modules/users) |
| GET | /dados-usuario | ✅ | --- | Se professor: { dados_usuario }; se aluno: { dados_usuario, streak_caloria, streak_hidratacao, metricas: [] } | 200, 404, 500 | `src/modules/loadUserData.ts` define o formato exato das métricas |
| GET | /data-atual | ❌ | --- | (utilitário) string/data atual | 200 | Controlador simples (dateController) |
| POST | /update/:type | ✅ | params: type; body: { valor } | 200 string mensagem | 200, 400, 500 | Processa em `src/modules/updateMetricData.ts`; aceita tipos simples e JSON (ex.: medidas_corporais) |
| POST | /updateUserData/:type | ✅ | params: type; body: { valor } | 200 string mensagem | 200, 400, 500 | Atualiza campos válidos: nome,email,sexo,data_nascimento,objetivo,avatar (`src/modules/updateUserData.ts`) |
| POST | /chatSaudeMais | ✅ | body: { mensagem: string } | 200 JSON stringified { text: "..." } ou 429 { text: "easter egg" } | 200, 429, 400, 500 | Limite 3 msgs/min por usuário; usa `src/modules/loadChatResponse.ts` e Gemini API |
| GET | /alimentos-dieta | ❌ | Nota: rota legacy — controlador lê params userId/weekLabel. Preferir `/alunos/:userId/dieta/:weekLabel` | 200 lista de entradas | 200, 404, 500 | Controller `src/controllers/getAlimentosDieta.ts` usa `loadWeeklyDiet` |
| GET | /alunos/:userId/dieta/:weekLabel | ❌ | params: userId (int), weekLabel (string) | 200 lista (rows: { id, entry_date, weekday, title, details }) | 200, 404, 500 | `src/modules/loadWeeklyDiet.ts` retorna rows da tabela weekly_entries |
| GET | /alunos/:userId/exercicio/:weekLabel | ❌ | params: userId, weekLabel | 200 lista (rows: { id, entry_date, weekday, title, details }) | 200, 404, 500 | `src/modules/loadExerciciosWeeklyData.ts` |
| GET | /refeicoes/alimentos | ✅ | query?: id (note: controller reads req.params.id — inconsistente) | 200 lista de refeições (mock) — array de refeições com campos: id, nome, alimentos[] | 200, 404, 500 | `src/modules/loadRefeicoesData.ts` atualmente retorna mock com estrutura detalhada |
| POST | /refeicoes/alimento | ✅ | body: { alimentoData: { refeicaoId, alimentoId, quantidade, ... } } | 200 success or 400/500 | 200, 400, 500 | Processado por `src/modules/createAlimentoRefeicao.ts` (retorno: success,message,data) |
| POST | /createExercise | ✅ | body: ExerciseCreate (ver resumo) | 200 { message, response } ou 400/404/500 | 200, 400, 404, 500 | `src/modules/createExerciseData.ts` insere ou atualiza exercicios; descrição é armazenada como JSON array |
| GET | /getExercises | ✅ | --- | 200 array de linhas da tabela `exercicios` (cada linha tem id,tipo,descricao(JSON),duracao_minutos,data,criado_em) | 200, 404, 500 | `src/modules/loadExerciseData.ts` |
| GET | /professor/me/conexoes | ✅ (professor) | --- | 200 lista de conexões do professor | 200, 403, 500 | Protegido por `acessOnly('professor')` middleware |
| GET | /professor/avaiable/conexoes | ✅ (professor) | --- | 200 { total, alunosDisponiveis: [ { id,nome,email,categoria,avatar,objetivo } ] } | 200, 500 | Implementado em `src/modules/loadAvaiableConnections.ts` |
| POST | /professor/conectar/:alunoId | ✅ (professor) | params: alunoId | 201 { success:true, message, insertId } ou 200 { alreadyExists:true } | 201, 200, 400, 500 | `src/modules/createRequestConnection.ts` retorna alreadyExists se já havia pedido pendente |
| GET | /professor/conectar/listar | ✅ (professor) | --- | 200 { alunos: [ { id, nome, email, status } ] } | 200, 500 | `src/modules/loadProfessorListConnection.ts` retorna conexões aceitas (JOIN) |
| GET | /professor/dados-saude/alunos/:id? | ✅ (professor) | params id optional | 200 { success, message, total, data: [...] } ou 200 empty | 200, 500 | `src/controllers/getManyUsersDataHealth.ts` chama `loadUsersHealthData` que converte rows para formato do front |
| POST | /professor/dados-saude/weekly-entries | ✅ (professor) | body: custom (passado ao mesmo controller) | 200 aggregated data | 200, 500 | Rota reutilizada para POST com payload de filtro; controller reusa `loadUsersHealthData` dependendo do payload |
| GET | /alunos/me/conexoes | ✅ | --- | 200 { linked: boolean, status, conexao_id?, professor: {...}, requested_at?, responded_at? } | 200, 500 | `src/modules/loadAlunoConnections.ts` retorna último registro ou objeto com linked:false |
| POST | /alunos/conexoes/:conexao_id/responder | ✅ | params: conexao_id; body: { status: "accepted" | "rejected" } | 200 { success:true, message, connectionId, professorId, alunoId, status } ou 400/404 | 200, 400, 404, 500 | `src/modules/responseConnection.ts` verifica propriedade e atualiza status |

---

## Observações finais e recomendações

- Padronizar rotas com parâmetros: há inconsistências (`/refeicoes/alimentos` vs controller que lê `req.params.id`; `alimentos-dieta` vs `/alunos/:userId/dieta/:weekLabel`). Recomendo normalizar para evitar confusão no cliente/API docs.

- Posso transformar essa tabela em parte do `API_DOCUMENTATION.md` (integrar) ou manter como arquivo separado. Deseja que eu atualize `API_DOCUMENTATION.md` incorporando a tabela?

- Próximo passo que eu posso executar automaticamente:
  - Gerar tabelas em HTML ou incorporar a tabela em `API_DOCUMENTATION.md` (se preferir uma única referência).
  - Gerar exemplos JSON para cada rota usando dados reais dos módulos (por ex. exemplo de `getUserData` com campos reais).

Diga qual opção prefere: integrar tabela ao `API_DOCUMENTATION.md` | gerar Postman | detalhar exemplos por rota | corrigir rotas no código (propor patches).