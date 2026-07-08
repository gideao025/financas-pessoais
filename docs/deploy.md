# Deploy, ambientes e segurança

## Perfis (Spring `SPRING_PROFILES_ACTIVE`)

| Perfil | Seed de exemplo | JWT_SECRET | Uso |
|---|---|---|---|
| `dev` | ✅ carrega | default ok | local, desenvolvimento (padrão) |
| `hmlg` | ✅ carrega | default ok | homologação/testes |
| `prd` | ❌ não carrega | **obrigatório forte** | produção (docker-vm) |

- O seed fica em `db/seed` e só é aplicado pelo Flyway em `dev`/`hmlg` (`application-{dev,hmlg}.yml`).
- Em `prd`, o app **recusa iniciar** se o `JWT_SECRET` for o default (`ProductionSecurityGuard`).
- `spring.flyway.ignore-migration-patterns: "*:missing"` faz o `prd` ignorar o V5 (seed) que já foi
  aplicado em bancos antigos e não existe mais na base de migrations estruturais.

## Configuração via `.env`

O `docker compose` carrega o `.env` automaticamente. **Nunca versione o `.env`** (já está no `.gitignore`).

```bash
cp .env.example .env
# edite .env conforme o ambiente
```

Variáveis:

| Variável | Descrição |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` / `hmlg` / `prd` |
| `JWT_SECRET` | segredo do JWT (obrigatório em prd) |
| `DB_PASSWORD` | senha do Postgres |

## Subir em desenvolvimento (local / LAN)

Sem `.env`, os defaults do compose já usam `dev`:

```bash
docker compose up --build -d
```

## Subir em produção (docker-vm — Ubuntu Server)

### 1. Gerar o JWT_SECRET

Na docker-vm, gere um segredo forte (48 bytes → base64). Qualquer um serve:

```bash
openssl rand -base64 48
```

Alternativas caso não tenha o `openssl`:

```bash
head -c 48 /dev/urandom | base64        # equivalente
# ou
tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64; echo
```

Copie a saída.

### 2. Criar o `.env` de produção

```bash
cd /caminho/do/projeto
cp .env.example .env
nano .env
```

Deixe assim (colando o segredo gerado e uma senha de banco forte):

```dotenv
SPRING_PROFILES_ACTIVE=prd
JWT_SECRET=<cole-aqui-o-openssl-rand>
DB_PASSWORD=<senha-forte-do-postgres>
```

> Se trocar `DB_PASSWORD` num banco que já existe, o Postgres **não** altera a senha de um volume já
> inicializado. Ou defina a senha antes do primeiro `up`, ou altere no banco:
> `docker compose exec postgres psql -U financas -c "ALTER USER financas PASSWORD 'nova-senha';"`
> e mantenha o mesmo valor no `.env`.

### 3. Subir

```bash
git pull origin main
docker compose up --build -d
docker compose logs -f backend   # confirmar "Started FinancasPessoaisApplication"
```

Se o `JWT_SECRET` estiver ausente/default em `prd`, o backend falha no start com uma mensagem clara —
isso é proposital.

## ⚠️ Ação manual importante na docker-vm

O seed (`V5`) **já rodou** no banco da docker-vm antes desta mudança, então o usuário de exemplo
**já existe** com senha conhecida. Mudar para `prd` não remove dados existentes. Faça uma vez:

```bash
# trocar a senha do usuário do seed
docker compose exec postgres psql -U financas -d financas \
  -c "update users set password_hash = '<novo-hash-bcrypt>' where email = 'gideao@email.com';"

# OU remover o usuário de exemplo (apaga os dados dele em cascata)
docker compose exec postgres psql -U financas -d financas \
  -c "delete from users where email = 'gideao@email.com';"
```

Para gerar um hash bcrypt novo, o jeito mais simples é criar um usuário real pela tela de registro do
app e depois apagar o do seed.

## Checklist de produção

- [ ] `.env` com `SPRING_PROFILES_ACTIVE=prd`
- [ ] `JWT_SECRET` forte (gerado com `openssl rand -base64 48`)
- [ ] `DB_PASSWORD` forte
- [ ] usuário do seed trocado/removido no banco
- [ ] Cloudflare apontando para o **frontend** (`:9090`) e "Always Use HTTPS" ligado
- [ ] (recomendado) rate limit / WAF no Cloudflare para `/api/auth/*`
