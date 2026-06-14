# Finanças Pessoais — CLAUDE.md

Aplicação de finanças pessoais com frontend Angular e backend Spring Boot. Objetivo imediato: POC funcional ponta a ponta, substituindo mocks por integração real.

## Estrutura do repositório

```
financas-pessoais/
├── frontend/          # Angular 21 + Tailwind CSS
├── backend/           # Spring Boot 3.4.2 / Java 21
├── docker-compose.yml # Stack completa (postgres + backend + frontend)
├── PLAN.md            # Fases e tasks do roadmap
├── AGENTS.md          # Regras e escopo para agentes
└── .claude/skills/    # Skills do projeto (convenções de frontend e backend)
```

## Skills do projeto

Convenções e templates concretos derivados deste código. Consulte a skill correspondente antes de mexer em cada camada:

- **`frontend`** (`.claude/skills/frontend/SKILL.md`) — Angular 21: standalone components, estado em signals, serviços HTTP, padrão de página (loading/erro/mensagem), Tailwind pt-BR, auth já cabeada. Use ao criar/editar qualquer coisa sob `frontend/src/app`.
- **`backend`** (`.claude/skills/backend/SKILL.md`) — Spring Boot: um pacote por domínio, scoping por usuário, camadas Controller→Service→Repository, DTOs como records, `BusinessException`, migrations Flyway. Use ao criar/editar qualquer coisa sob `backend/src/main/java`.

As duas compartilham o mesmo contrato de DTOs (`core/models/api.models.ts` ↔ records do backend) e o mesmo loop de verificação via Docker.

## Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose
- (opcional, dev) Node 22+, Java 21, Maven 3.9+

### Stack completa via Docker (recomendado)

```bash
docker compose up --build
```

Serviços sobem em:
- Frontend: http://localhost:9090
- Backend:  http://localhost:9091
- Postgres: localhost:5433

### Apenas banco (para rodar backend local)

```bash
cd backend
docker compose up -d   # sobe apenas postgres na 5432
```

### Backend local (requer Maven instalado — não há mvnw)

```bash
cd backend
mvn spring-boot:run
```

### Frontend local

```bash
cd frontend
npm install
npm start   # http://localhost:4200
```

## Backend

**Package base:** `com.financaspessoais.api`

**Tecnologias:** Spring Boot 3.4.2, Java 21, Spring Security, Flyway, PostgreSQL, JJWT 0.12.6, Lombok

**Variáveis de ambiente (com defaults):**
| Variável | Default |
|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/financas` |
| `DB_USER` | `financas` |
| `DB_PASSWORD` | `financas` |
| `SERVER_PORT` | `8080` |
| `JWT_SECRET` | `change-me-in-production-change-me-in-production-change-me` |
| `JWT_ACCESS_EXPIRATION` | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION` | `1209600000` (14 dias) |

**Endpoints disponíveis:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET/POST /api/accounts`
- `GET/POST /api/cards`
- `GET/POST /api/transactions`
- `GET/POST /api/goals`
- `GET /api/reports/dashboard-summary`
- `GET/PATCH /api/settings`
- `GET /actuator/health`

**Migrações Flyway:**
- `V1__init_schema.sql` — users, refresh_tokens, accounts, cards, transactions, user_settings
- `V2__goals.sql` — goals

`ddl-auto: validate` — nunca alterar schema fora de migrations Flyway.

## Frontend

**Tecnologias:** Angular 21, Tailwind CSS, nginx (Docker)

**Resolução da API base** (`core/api.config.ts`):
- Porta `9090` → `http://localhost:9091/api`
- Qualquer outra → `http://localhost:8080/api`

**Rotas** (todas sob `ShellLayoutComponent` + `authGuard`, exceto `/auth`):
```
/auth         → AuthPageComponent        (login + registro, público)
/dashboard    → DashboardOverviewPage
/accounts     → AccountsPage             (gestão de contas bancárias)
/transactions → TransactionsPage
/reports      → ReportsPage
/goals        → GoalsPage
/cards        → CreditCardsPage
/settings     → SettingsPage
```

**Camada de serviços HTTP** (`core/services/`):
- `auth.service.ts` — login, registro, refresh token, logout
- `accounts.service.ts` (list/create/update), `transactions.service.ts`, `goals.service.ts`, `cards.service.ts`, `reports.service.ts`, `settings.service.ts`

**Interceptor e guard** (`core/auth/`):
- `auth.interceptor.ts` — injeta Bearer token em todas as requisições
- `auth.guard.ts` — redireciona para `/auth` se não autenticado

**Navegação:** a sidebar real é inline no `layouts/shell-layout/shell-layout.component.html`. (O antigo `components/sidebar/`, código morto, foi removido na Task 16.)

**Mocks:** `app/mocks/finance.mock.ts` foi removido na Task 16 — nenhuma página o importava. Não há mais mocks no app.

**Layout templates** em `layout_templates/stitch_finance_dashboard_overview/` — referência visual para cada tela (HTML + screenshot PNG).

## CORS

Permitidos: `http://localhost:4200` e `http://localhost:9090`.

Configuração em `WebConfig.java`. Se adicionar nova origem, atualizar aqui.

## Regras para agentes

- Ler PLAN.md e AGENTS.md antes de editar qualquer coisa
- Não substituir mocks por integração parcial — fechar o fluxo completo da tela ou não mexer
- Nunca alterar `node_modules`, `dist`, `target`
- Nunca reverter mudanças do usuário sem pedido explícito
- Mudanças no schema vão em nova migration Flyway (nunca editar migrations existentes)
- Ao finalizar integração de uma tela, remover o import do mock correspondente

## Estado atual da POC

| Área | Status |
|---|---|
| Banco / Flyway | OK no Docker |
| Backend (auth, accounts, transactions, goals, cards, reports, settings) | Implementado |
| Frontend — auth page | Integrado |
| Frontend — dashboard | Integrado |
| Frontend — accounts (gestão de contas) | Integrado (Task 17) |
| Frontend — transactions | Integrado |
| Frontend — goals | Integrado |
| Frontend — cards | Integrado |
| Frontend — reports | Integrado |
| Frontend — settings | Integrado |
| CORS docker (porta 9090) | Configurado |
| Sem mvnw | Usar `mvn` direto |

Teste ponta a ponta executado e aprovado (API + UI). O app não tem mais mocks: `finance.mock.ts` e `components/sidebar/` foram removidos na Task 16. Todas as telas da POC consomem a API real. POC fechada — backlog pós-POC em `PLAN.md` (Task 15).

## Problemas conhecidos

- Backend não possui `mvnw` — depende de Maven instalado no host para rodar fora do Docker
- Sem testes automatizados relevantes (validação foi manual); CRUDs assimétricos por recurso — ver backlog em `PLAN.md` (Task 15)
