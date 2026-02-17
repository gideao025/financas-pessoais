# Backend - Finanças Pessoais

## Stack
- Java 21
- Spring Boot 3
- PostgreSQL
- Flyway
- JWT (access + refresh token)

## Rodar banco local
```bash
docker compose up -d
```

## Rodar aplicação
```bash
./mvnw spring-boot:run
```

## Variáveis de ambiente
- `DB_URL` (default: `jdbc:postgresql://localhost:5440/financas`)
- `DB_USER` (default: `financas`)
- `DB_PASSWORD` (default: `financas`)
- `JWT_SECRET` (default dev no `application.yml`)
- `JWT_ACCESS_EXPIRATION` (default: `900000`)
- `JWT_REFRESH_EXPIRATION` (default: `1209600000`)
