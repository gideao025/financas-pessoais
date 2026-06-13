# Backend - Finanças Pessoais

## Stack
- Java 21
- Spring Boot 3.4.2
- PostgreSQL
- Flyway
- JWT (access + refresh token)

## Pré-requisitos
- Docker e Docker Compose para subir o banco ou a stack completa
- Java 21 para rodar o backend fora de container
- Maven 3.9+ apenas se você quiser rodar o backend localmente fora do Docker

## Opção 1: rodar apenas o banco local
No diretório `backend/`:

```bash
docker compose up -d
```

Isso sobe o PostgreSQL em `localhost:5432` com:
- banco: `financas`
- usuário: `financas`
- senha: `financas`

## Opção 2: rodar a stack completa via Docker
Na raiz do repositório:

```bash
docker compose up --build
```

Serviços esperados:
- frontend: `http://localhost:9090`
- backend: `http://localhost:9091`
- health: `http://localhost:9091/actuator/health`
- postgres: `localhost:5433`

## Opção 3: rodar backend localmente
Atualmente o projeto não versiona `mvnw`, então esta opção exige Maven instalado na máquina.

1. Suba o banco:

```bash
docker compose up -d
```

2. Rode o backend no diretório `backend/`:

```bash
mvn spring-boot:run
```

## Variáveis de ambiente
- `DB_URL` (default: `jdbc:postgresql://localhost:5432/financas`)
- `DB_USER` (default: `financas`)
- `DB_PASSWORD` (default: `financas`)
- `JWT_SECRET` (default dev no `application.yml`)
- `JWT_ACCESS_EXPIRATION` (default: `900000`)
- `JWT_REFRESH_EXPIRATION` (default: `1209600000`)

## Estado atual da POC
- o backend já expõe endpoints principais em `/api/auth`, `/api/accounts`, `/api/cards`, `/api/transactions`, `/api/goals`, `/api/reports` e `/api/settings`
- o frontend ainda usa mocks locais e nao consome a API real
- para uma POC full stack ainda falta integrar login/token e consumo HTTP no frontend
