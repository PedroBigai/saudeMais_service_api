# Documentação da API - SaúdeMais

## Visão Geral

Esta é uma API RESTful para gerenciamento de usuários e métricas de saúde.

- **Autenticação JWT**
- **Cadastro de usuários**
- **Verificação de e-mail**
- **Registro e atualização de métricas** (altura, peso, dieta, etc.)
- **Atualização automática** das métricas diariamente via cron (todos os dias gera novas linhas para cada tipo de dados disponível)

## URL Base

Normalmente, a API roda localmente em:

```
http://localhost:3000
```

Se estiver hospedada em outro domínio/porta, ajustar conforme necessário.

---

## Autenticação

As rotas protegidas exigem um **token JWT** no cabeçalho:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

Caso você faça login com credenciais corretas, a API retorna esse token.

---

## Endpoints

### 1. Verificar E-mail

`GET /verificar-email/:email`
Verifica se o e-mail já está cadastrado.

#### Exemplo de requisição:

```
GET /verificar-email/joao@email.com
```

#### Exemplo de resposta:

```json
{
  "disponivel": true
}
```

> `disponivel = true` significa que o e-mail **não está** cadastrado (está disponível).

---

### 2. Cadastro de Usuário

`POST /cadastro`
Cadastra um novo usuário e insere métricas padrão.

#### Exemplo de corpo:

```json
{
  "nome": "João",
  "email": "joao@email.com",
  "senha": "123456",
  "altura": 180,
  "peso": 80,
  "nascimento": "1990-01-01",
  "sexo": "masculino",
  "objetivo": "perder peso"
}
```

#### Possíveis respostas:

- **200 OK**: Exemplo
  ```json
  "Cadastro e métricas salvas com sucesso!"
  ```
- **400 Bad Request**: Exemplo
  ```json
  "E-mail já cadastrado."
  ```
- **500 Internal Server Error**: Erro interno.

---

### 3. Login

`POST /login`
Realiza login do usuário e retorna um **token JWT**.

#### Exemplo de corpo:

```json
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

#### Exemplo de resposta:

```json
{
  "token": "JWT_TOKEN_AQUI"
}
```

> Use esse token para acessar rotas autenticadas.

---

### 4. Dados do Usuário (autenticado)

`GET /dados-usuario`

Retorna os dados do usuário logado + histórico de métricas.

#### Exemplo de cabeçalho:

```
Authorization: Bearer JWT_TOKEN_AQUI
```

#### Exemplo de resposta:

```json
{
  "dados_usuario": {
    "nome": "João",
    "email": "joao@email.com",
    "data_nascimento": "1990-01-01",
    "sexo": "masculino",
    "objetivo": "perder peso"
  },
  "metricas": [
    {
      "tipo": "altura",
      "valor": { "altura": 180 },
      "registrado_em": "2025-03-30T00:00:00.000Z"
    },
    {
      "tipo": "peso",
      "valor": { "peso": 80 },
      "registrado_em": "2025-03-30T00:00:00.000Z"
    },
    {
      "tipo": "calorias",
      "valor": { "consumido": 0, "meta": 2000 },
      "registrado_em": "2025-03-30T00:00:00.000Z"
    },
    {
      "tipo": "sono",
      "valor": { "tempo_descanso": 7, "qualidade": "boa" },
      "registrado_em": "2025-03-30T00:00:00.000Z"
    }
  ]
}
```

#### Possíveis respostas:

- **200 OK**: Retorna o objeto com `dados_usuario` e `metricas`.
- **400 Bad Request**: `"ID de usuário inválido."`
- **404 Not Found**: `"Nenhum dado encontrado para o usuário."`
- **403 Forbidden**: Se o token JWT não for passado ou for inválido.

---

### 5. Atualizar Métrica do Dia (autenticado)

`POST /update/:type`

Atualiza ou insere a métrica **do dia atual** para o usuário autenticado.

#### Parâmetros de rota

- **:type**: Tipo da métrica (por exemplo, `altura`, `peso`, `sono`, `calorias`, `dieta`, etc.)

#### Exemplo de requisição:

```
POST /update/sono
Authorization: Bearer JWT_TOKEN_AQUI
Content-Type: application/json

{
  "valor": {
    "tempo_descanso": 7,
    "qualidade": "boa"
  }
}
```

#### Exemplo de resposta:

```json
"Métrica de sono atualizada."
```

> Se não existir ainda uma métrica para o dia, ela é criada.

#### Possíveis respostas:

- **200 OK**: `"Métrica de sono atualizada."` (ou o tipo que você enviou)
- **400 Bad Request**: `"Parâmetros obrigatórios ausentes."`
- **403 Forbidden**: Se o token JWT não for passado ou for inválido.
- **500 Internal Server Error**: Erro interno.

---

## Rotas Auxiliares

- `GET /` (raiz): Retorna
  ```json
  {
    "mensagem": "API funcionando corretamente! sV1.0.0"
  }
  ```

---

## Agendamento Diário (Cron)

- O job roda às `00:05` da manhã (no seu exemplo, está `23 20 * * *`, mas é configurável)
- Para cada usuário e **cada tipo** de métrica, verifica se já existe registro para o dia:
  - Se **não existir**, clona a última métrica do dia anterior
  - Evita duplicar registros
- Exemplo de log:
  ```
  🕐 Executando replicação de métricas...
  ✅ Métricas clonadas para o novo dia.
  ```

---

## Códigos de Status Comuns

- **200**: Sucesso
- **202**: Aceito (usado em `/verificar-email`)
- **400**: Erro de parâmetros (faltando campos, etc.)
- **403**: Acesso negado (token inválido ou ausente)
- **404**: Não encontrado
- **500**: Erro interno do servidor

---

## Observações Finais

- **Banco de Dados**: Tabelas `usuarios` e `metricas`.
- **Coluna** `valor` é `JSONB` e pode ter qualquer estrutura (dependendo do tipo).
- **Exemplo** de tipos de métricas: `altura`, `peso`, `calorias`, `hidratacao`, `sono`, `dieta`, `exercicios`, etc.
- **Uso**: O front pode mostrar gráficos de evolução.

---

### Contato

Dúvidas ou problemas, entre em contato com o desenvolvedor.
