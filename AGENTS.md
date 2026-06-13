# AGENTS

## Projeto
Finanças Pessoais

Aplicação dividida em:
- `frontend/`: Angular 21
- `backend/`: Spring Boot 3 / Java 21
- `backend/docker-compose.yml`: PostgreSQL local
- `docker-compose.yml`: compose raiz para stack completa, atualmente com conflito de merge

## Objetivo do projeto
Construir uma aplicação de finanças pessoais com:
- autenticação JWT
- gestão de contas
- cartões
- transações
- metas
- relatórios
- configurações do usuário

## Estado atual
### Frontend
- Angular 21 com rotas e telas prontas
- usa dados mockados locais
- não está integrado ao backend
- não há fluxo real de login/token

### Backend
- Spring Boot 3.4.2
- Java 21
- PostgreSQL
- Flyway
- JWT access + refresh token
- endpoints principais já existem:
  - `/api/auth`
  - `/api/accounts`
  - `/api/cards`
  - `/api/transactions`
  - `/api/goals`
  - `/api/reports`
  - `/api/settings`

### Infra
- compose do banco existe em `backend/docker-compose.yml`
- compose da raiz está quebrado por conflito de merge
- backend local depende de Maven, mas o projeto não possui `mvnw`
- no ambiente analisado, `mvn` não está instalado

## Regras de trabalho para agentes
- sempre ler o contexto antes de editar
- preferir mudanças pequenas e objetivas
- não substituir mocks por integração parcial sem fechar o fluxo completo da tela
- não mexer em arquivos gerados (`node_modules`, `dist`, `target`) exceto quando explicitamente necessário
- nunca reverter mudanças do usuário sem pedido explícito
- validar bootstrap local antes de declarar a POC pronta

## Agentes recomendados

### 1. bootstrap-agent
Responsabilidade:
- corrigir a experiência de subida local
- alinhar `README`, `compose`, `mvnw` ou dependência de Maven
- garantir que backend, banco e frontend tenham um fluxo mínimo reproduzível

Foco:
- `docker-compose.yml`
- `backend/docker-compose.yml`
- `backend/README.md`
- wrapper Maven ou instruções equivalentes

Critério de pronto:
- passos claros para subir localmente sem ambiguidade

### 2. backend-agent
Responsabilidade:
- validar a API Spring Boot
- garantir consistência entre autenticação, migrations e endpoints
- revisar configuração de CORS e segurança para o ambiente local

Foco:
- `backend/src/main/java/**`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/db/migration/**`

Critério de pronto:
- backend sobe com banco e responde health/auth

### 3. frontend-agent
Responsabilidade:
- substituir mocks por consumo real da API
- implementar autenticação básica
- conectar dashboard e telas prioritárias ao backend

Foco:
- `frontend/src/app/**`
- serviços HTTP
- guards/interceptors
- estados mínimos de loading/erro

Critério de pronto:
- login funcional
- pelo menos um fluxo principal consumindo a API real

### 4. poc-agent
Responsabilidade:
- transformar o projeto em uma POC demonstrável
- priorizar fluxo funcional ao invés de cobertura completa
- definir o escopo mínimo da demo

Escopo sugerido da POC:
- registrar usuário
- login
- cadastrar conta
- cadastrar transação
- visualizar resumo/dashboard
- cadastrar meta

Critério de pronto:
- demo ponta a ponta executável localmente

## Prioridade funcional da POC
1. autenticação
2. contas
3. transações
4. dashboard/resumo
5. metas
6. cartões
7. configurações
8. relatórios avançados

## Ambientes e portas esperadas
### Desenvolvimento local
- frontend Angular: `http://localhost:4200`
- backend Spring Boot: `http://localhost:8080`
- postgres: `localhost:5432`

### Docker
- frontend: `9090`
- backend: `9091`
- banco: revisar compose raiz antes de usar

## Problemas conhecidos
- `docker-compose.yml` raiz com conflito de merge
- compose raiz referencia conexão inconsistente com Postgres
- `backend/README.md` menciona `./mvnw`, mas o arquivo não existe
- frontend usa apenas mocks
- CORS permite `http://localhost:4200`, mas não contempla frontend servido pela `9090`

## Definição de pronto da POC local
A POC local será considerada pronta quando:
- banco subir sem intervenção manual fora do procedimento documentado
- backend iniciar e aplicar migrations
- frontend iniciar sem depender de mocks para o fluxo principal
- usuário conseguir registrar, logar, cadastrar dados mínimos e visualizar resumo
- documentação de execução local estiver consistente
