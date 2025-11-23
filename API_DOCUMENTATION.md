# SaudeMais API — Documentação Completa

Esta documentação descreve os endpoints, autenticação, exemplos de requisição/resposta e o fluxo de recuperação de senha da API `SaudeMais`.

> Versão: 1.0.0

## Visão geral

Base URL (desenvolvimento): `http://localhost:3000`

A API oferece recursos para:
- Cadastro e autenticação de usuários
- Recuperação de senha via OTP (com sessão curta por cookie + CSRF)
- Gerenciamento de métricas pessoais e dados de saúde
- Registro e leitura de exercícios
- Gerenciamento de refeições e alimentos
- Conexões entre professores e alunos (envio/aceitação de solicitações)
- Chat interno (limite de 3 mensagens/minuto)

## Autenticação

- Autenticação principal: JWT Bearer
  - Enviar header: `Authorization: Bearer <token>`
  - O middleware `verificarToken` espera o token em `Authorization` e seta `req.usuarioId` e `req.categoria` a partir do payload.

- Recuperação de senha (fluxo OTP): usa cookies para criar uma sessão curta (`pr_session` HttpOnly) e um cookie `pr_csrf` legível para double-submit CSRF. A confirmação da nova senha requer o header `X-CSRF-Token` com o valor do cookie `pr_csrf`.

## Endpoints principais

Observação: listei os endpoints conforme `src/server/routes.ts` e os controladores em `src/controllers`. Onde existiam ambiguidades (ex.: rota sem path param, mas controlador lê `req.params`), marquei com nota — sugiro confirmar essas rotas no código caso necessário.

### Geral

- GET / — health check
  - Resposta: { mensagem: string }

### Autenticação / Usuário

- GET /verificar-email/{email}
  - Parâmetros: `email` (path)
  - Retorno: verifica existência do e-mail

- POST /cadastro
  - Body (application/json):
    - nome (string), email (string), senha (string), categoria (string), idade (integer) — ver `utils/validators` para regras
  - Respostas:
    - 200: success
    - 400: validação ou e-mail já cadastrado

- POST /login
  - Body: { email, senha }
  - 200: { token }
  - 401: credenciais inválidas

### Recuperação de senha (OTP)

Fluxo completo:
1. POST /password-reset/request { email }
   - Envia OTP para o e-mail (respostas: rate-limited 429, ou 200 com expiresInSec)
2. POST /password-reset/verify { email, token }
   - Verifica OTP; se OK cria cookies:
     - `pr_session` (HttpOnly JWT curto)
     - `pr_csrf` (cookie legível)
3. GET /password-reset/status
   - Pode retornar { ok: true, csrf } se sessão válida
4. POST /password-reset/confirm
   - Requer header `X-CSRF-Token` com valor igual ao cookie `pr_csrf`
   - Body: { novaSenha }
   - Validações de senha: >=8, letra+numero, sem repetições/seqüências longas

### Usuário autenticado
(Enviar header `Authorization: Bearer <token>`)

- GET /dados-usuario
  - Retorna dados e métricas do usuário autenticado

- POST /update/{type}
  - Path param: type (string)
  - Body: { valor }
  - Atualiza métrica (ex.: peso)

- POST /updateUserData/{type}
  - Body: { valor }
  - Atualiza dado pessoal (ex.: nome, telefone)

### Exercícios

- POST /createExercise
  - Body: { tipo, descricao, duracao_minutos?, data, criado_em? }
  - `tipo` deve ser um de: `aerobico`, `forca`, `mobilidade`, `fortalecimento`
  - Respostas: 200 success, 400 invalid

- GET /getExercises
  - Retorna lista de exercícios do usuário autenticado

- GET /alunos/{userId}/exercicio/{weekLabel}
  - Rota pública (segundo routes.ts): retorna exercícios semanais de um aluno

### Dieta / Refeições

- GET /alimentos-dieta
  - Nota: rota existe, mas o controlador espera `userId` e `weekLabel` em params. Preferir usar `/alunos/{userId}/dieta/{weekLabel}`

- GET /alunos/{userId}/dieta/{weekLabel}
  - Parâmetros: `userId`, `weekLabel`
  - Retorna dieta semanal

- GET /refeicoes/alimentos
  - Protegido: requer token
  - Observação: controlador lê `req.params.id`, mas rota não inclui `:id`. Pode aceitar `?id=` como query — confirmar.

- POST /refeicoes/alimento
  - Protegido
  - Body: { alimentoData }

### Chat

- POST /chatSaudeMais
  - Protegido
  - Body: { mensagem }
  - Rate limit interno: 3 mensagens por minuto por usuário — retorna 429 com mensagem "easter egg" quando estoura

### Conexões (professor/aluno)

Rotas de professor (requer `categoria: professor` para alguns endpoints — middleware `acessOnly`):

- GET /professor/me/conexoes
- GET /professor/avaiable/conexoes
- POST /professor/conectar/{alunoId}
- GET /professor/conectar/listar
- GET /professor/dados-saude/alunos/{id?}
- POST /professor/dados-saude/weekly-entries

Rotas de aluno:

- GET /alunos/me/conexoes
- POST /alunos/conexoes/{conexao_id}/responder  (Body: { status: "accepted" | "rejected" })

## Exemplos rápidos (cURL)

Autenticar e usar Bearer token:

1) Login

curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"usuario@ex.com","senha":"senha"}'

Resposta esperada:
{ "token": "eyJ..." }

2) Usar token

curl -H "Authorization: Bearer eyJ..." http://localhost:3000/dados-usuario

### Password-reset (fluxo resumido)

1) Solicitar OTP:

curl -X POST http://localhost:3000/password-reset/request -H "Content-Type: application/json" -d '{"email":"usuario@ex.com"}'

2) Verificar OTP (recebe cookies HttpOnly `pr_session` e `pr_csrf`):

curl -i -X POST http://localhost:3000/password-reset/verify -H "Content-Type: application/json" -d '{"email":"usuario@ex.com","token":"123456"}'

3) Confirmar nova senha (no browser/cliente que preserva cookies):

curl -X POST http://localhost:3000/password-reset/confirm -H "Content-Type: application/json" -H "X-CSRF-Token: <valor_do_cookie_pr_csrf>" -d '{"novaSenha":"NovaSenha123"}' --cookie "pr_session=<jwt>; pr_csrf=<csrf>"

> Observação: em ambientes sem cookie (ex.: Postman), ao verificar a etapa 2 você deve usar a aba Cookies e enviar ambos os cookies na etapa 3.

## Observações e pontos a confirmar

- Existem pequenas inconsistências entre routes e controllers (por exemplo `GET /refeicoes/alimentos` não possui `:id` no path mas o controlador lê `req.params.id`; `GET /alimentos-dieta` existe e o controlador também é usado em `/alunos/:userId/dieta/:weekLabel`). Recomendo revisar e padronizar os caminhos (path params vs query params).

- Schemas mais precisos (por exemplo estrutura de `alimentoData`, resposta de `getUserData`, formato exato de `loadManyUsersData`) podem ser extraídos dos módulos (`src/modules/*`) caso queira que eu gere um OpenAPI com schemas detalhados campo-a-campo.

## Arquivos gerados nesta entrega

- `openapi.yaml` — Especificação OpenAPI 3.0 (arquivo gerado automaticamente nesta sessão)
- `API_DOCUMENTATION.md` — Este documento (README de referência da API)

## Próximos passos sugeridos

- (Opcional) Gerar coleção Postman `postman_collection.json` a partir de `openapi.yaml`.
- Afinar schemas em `openapi.yaml` com formatos exatos dos objetos (`alimentoData`, `userData`, `exercise`), extraindo de `src/modules`.
- Adicionar exemplos reais de request/response para cada endpoint (por exemplo saída de `getUserData`).


---

Se quiser, eu:
- adapto o `openapi.yaml` com schemas mais precisos lendo os módulos (posso fazer isso automaticamente),
- gero a coleção Postman,
- ou converso contigo sobre as inconsistências e corrijo as rotas no código (se quiser que eu proponha mudanças no código, eu posso abrir um PR com as correções).

Diga qual próximo passo prefere: "detalhar schemas" | "gerar Postman" | "corrigir rotas" | "finalizar".
