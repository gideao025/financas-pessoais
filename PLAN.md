# PLAN

## Objetivo
Colocar a aplicação Finanças Pessoais para rodar localmente como POC funcional, com fluxo mínimo ponta a ponta.

## Escopo mínimo da POC
- registro de usuário
- login
- cadastro de conta
- cadastro de transação
- visualização de resumo/dashboard
- cadastro e listagem de metas

## Estado atual (atualizado em 2026-06-13)

POC concluída — fluxo ponta a ponta validado (API + UI) via teste manual.

- **Fase 1 (bootstrap)**: concluída — `docker compose up --build` sobe postgres + backend + frontend.
- **Fase 2 (backend)**: concluída — migrations Flyway aplicadas, `/actuator/health` OK, todos os endpoints da POC testados.
- **Fase 3 (integração frontend)**: concluída — auth, dashboard, transações, metas, cartões, relatórios e settings consomem a API real. Nenhuma tela importa mais `finance.mock.ts`.
- **Fase 4 (fechar POC)**: teste ponta a ponta executado e aprovado (Task 14). Falta consolidar backlog (Task 15) e checklist final (Task 16).

Bug corrigido na validação: `POST /api/accounts` agora cria conta sempre ativa.

Pendências mapeadas: ver Fase 5.

## Fase 1: Corrigir bootstrap local

### Task 1
Corrigir `docker-compose.yml` da raiz.
Critérios:
- remover conflito de merge
- definir serviços válidos
- alinhar dependências entre frontend, backend e postgres

### Task 2
Revisar configuração de conexão do backend no compose.
Critérios:
- usar host do serviço correto
- usar porta interna correta do Postgres na rede Docker
- garantir variáveis de ambiente coerentes com `application.yml`

### Task 3
Resolver ausência de Maven wrapper.
Critérios:
- adicionar `mvnw` ao projeto ou
- ajustar documentação para uso explícito de Maven instalado
- manter fluxo reproduzível

### Task 4
Atualizar documentação de execução local.
Critérios:
- incluir pré-requisitos
- incluir passo a passo local sem Docker completo
- incluir passo a passo com Docker
- remover instruções incorretas

## Fase 2: Validar backend

### Task 5
Subir banco local e validar migrations Flyway.
Critérios:
- tabelas principais criadas com sucesso
- sem erro de schema na inicialização

### Task 6
Validar inicialização do backend.
Critérios:
- aplicação sobe na porta esperada
- endpoint `/actuator/health` responde
- autenticação básica operacional

### Task 7
Testar endpoints críticos da POC.
Critérios:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST /api/accounts`
- `GET/POST /api/transactions`
- `GET/POST /api/goals`
- `GET /api/reports/dashboard-summary`

### Task 8
Revisar CORS para os modos de execução suportados.
Critérios:
- frontend em `4200` funciona
- se houver frontend em `9090`, permitir também esse origin quando necessário

## Fase 3: Integrar frontend ao backend

### Task 9
Mapear telas prioritárias e seus mocks.
Critérios:
- identificar quais componentes usam `finance.mock.ts`
- definir ordem de substituição por impacto na POC

### Task 10
Criar camada de serviços HTTP no frontend.
Critérios:
- autenticação
- contas
- transações
- metas
- resumo/dashboard

### Task 11
Implementar fluxo de autenticação no frontend.
Critérios:
- tela/fluxo de registro ou login
- persistência do token
- envio do bearer token nas requisições
- tratamento de sessão inválida

### Task 12
Substituir mocks das telas do escopo mínimo.
Critérios:
- dashboard consome API
- transações consomem API
- metas consomem API
- contas possuem fluxo funcional mínimo

### Task 13
Adicionar estados mínimos de UX.
Critérios:
- loading
- mensagem de erro
- mensagem de sucesso em ações principais

## Fase 4: Fechar a POC

### Task 14
Executar teste manual ponta a ponta.
Roteiro:
- registrar usuário
- logar
- cadastrar conta
- cadastrar transação
- visualizar dashboard
- cadastrar meta

Critérios:
- fluxo completo sem uso de mocks no caminho principal

### Task 15
Definir backlog do que fica fora da POC.
Exemplos:
- cartões completos
- relatórios avançados
- configurações persistidas no frontend
- refresh token automatizado mais robusto
- testes automatizados adicionais

### Task 16
Documentar checklist final de entrega.
Critérios:
- comandos para subir
- portas
- credenciais/exemplos
- limitações conhecidas da POC

## Fase 5: Evolução pós-POC

### Task 17
Criar tela dedicada de gerenciamento de contas bancárias.

Contexto:
- hoje contas só podem ser criadas inline na tela de transações (`criarConta` em `transactions-page`)
- não existe rota nem listagem própria de contas
- backend já expõe `GET /api/accounts`, `POST /api/accounts` e `PUT /api/accounts/{id}`

Escopo:
- nova rota `/accounts` protegida por `authGuard`, dentro do `ShellLayoutComponent`
- listar contas do usuário com saldo, tipo, instituição e status (ativa/inativa)
- criar nova conta (nome, tipo, instituição, saldo inicial)
- editar conta existente via `PUT /api/accounts/{id}` (inclui ativar/desativar)
- estados de loading, erro e sucesso seguindo o padrão das demais telas
- item de navegação na sidebar
- reaproveitar `AccountsService`; adicionar método `update(id, payload)`

Critérios de pronto:
- usuário cria, lista e edita contas sem passar pela tela de transações
- toggle de ativa/inativa reflete no backend
- nenhuma dependência de mock

Referência:
- seguir convenções da skill `frontend` (`.claude/skills/frontend/SKILL.md`)

## Dependências entre tasks
- Tasks 1 a 4 desbloqueiam 5 e 6
- Tasks 5 a 8 desbloqueiam 10 a 12
- Task 11 é dependência de 12
- Tasks 12 e 13 desbloqueiam 14
- Task 14 deve acontecer antes de 16
- Task 17 depende da Fase 3 concluída (camada de serviços e auth do frontend)

## Riscos atuais
- compose raiz inválido
- backend sem wrapper Maven
- frontend ainda totalmente mockado
- possível desalinhamento entre CORS e modo Docker
- documentação não reflete exatamente o estado atual do repositório

## Critério final de sucesso
A POC estará pronta quando qualquer pessoa com os pré-requisitos descritos conseguir:
- subir banco e backend
- iniciar frontend
- registrar e autenticar um usuário
- executar o fluxo principal de finanças sem depender de mocks
