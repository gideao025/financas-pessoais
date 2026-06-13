---
name: backend
description: Conventions and templates for the Spring Boot 3 / Java 21 backend of Finanças Pessoais. Use when creating or editing controllers, services, entities, repositories, DTOs, Flyway migrations, or security config under backend/src/main/java — adding an endpoint, a domain, or a DB table, or following the project's per-user-scoping and error-handling patterns.
---

# Backend — Finanças Pessoais

Spring Boot 3.4.2, Java 21, Spring Security + JWT, JPA/Hibernate, Flyway, PostgreSQL, Lombok. Serves the Angular frontend documented in the root `CLAUDE.md`.

## Golden rules

- **One package per domain** under `com.financaspessoais.api.domain.<thing>`, holding its Controller, Service, Entity, Repository, and the Request/Response records together. Cross-cutting code lives in `common/`, `config/`, `security/`, `jwt/`, `auth/`.
- **Everything is scoped to the logged-in user.** Get the id from `securityContextService.getUserId()` in the service — never trust a user id from the request body or path. Repositories filter by `userId` (e.g. `findByIdAndUserId`).
- **Layered, no shortcuts:** Controller (HTTP only) → Service (`@Transactional` business logic) → Repository (JPA). Controllers never touch repositories or entities.
- **DTOs are Java `record`s.** Requests carry Jakarta validation annotations; Responses expose a static `from(Entity)` factory. Entities never leak out of a controller.
- **Throw `BusinessException(message, HttpStatus)`** for expected failures — `GlobalExceptionHandler` turns it into the JSON the frontend reads. Never return raw `ResponseEntity` error bodies from a service.
- **Schema changes go in a new Flyway migration only.** `ddl-auto: validate` — Hibernate validates against the migrations at boot, so editing an applied migration breaks startup.
- **Messages are Portuguese** ("Conta não encontrada"); code identifiers are English. Domain enums are Portuguese-uppercase (`ENTRADA`/`SAIDA`, `CONCLUIDA`/`PENDENTE`).

## Domain layout (mirror an existing one — `account` is the reference)

```
domain/account/
├── AccountController.java   # @RestController @RequestMapping("/api/accounts")
├── AccountService.java      # @Service @RequiredArgsConstructor, @Transactional writes
├── AccountEntity.java       # @Entity @Table, Lombok @Getter/@Setter/@Builder
├── AccountRepository.java   # extends JpaRepository<Entity, UUID>, user-scoped finders
├── AccountRequest.java      # record + @NotBlank/@NotNull/... validation
├── AccountResponse.java     # record + static from(Entity)
└── AccountType.java         # enum (when applicable)
```

## Adding an endpoint / domain, end to end

1. **Migration** (if new table) → `Vn__name.sql` in `resources/db/migration/`. `id uuid primary key`, `user_id uuid not null references users(id) on delete cascade`, `created_at`/`updated_at timestamp not null`, plus `create index idx_<table>_user on <table>(user_id);`.
2. **Entity** → maps the table; `@Enumerated(EnumType.STRING)` for enums; `@ManyToOne(fetch = LAZY)` to `UserEntity` via `@JoinColumn(name = "user_id")`.
3. **Repository** → `extends JpaRepository<Entity, UUID>` with `findByUserIdOrderByCreatedAtDesc` and `findByIdAndUserId`.
4. **Request / Response records** → validation on Request, `from(Entity)` on Response.
5. **Service** → inject repository + `UserRepository` + `SecurityContextService`; scope every query to `getUserId()`.
6. **Controller** → thin; `@Valid @RequestBody`, `@ResponseStatus(HttpStatus.CREATED)` on POST.
7. **Mirror DTO field names** into the frontend `core/models/api.models.ts` (camelCase, same names).
8. **Verify** → rebuild the container and smoke-test with a real token. See "Verifying".

## Controller template

```java
@RestController
@RequestMapping("/api/xxx")
@RequiredArgsConstructor
public class XxxController {

  private final XxxService xxxService;

  @GetMapping
  public List<XxxResponse> listMine() {
    return xxxService.listMine();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public XxxResponse create(@Valid @RequestBody XxxRequest request) {
    return xxxService.create(request);
  }
}
```

## Service template — note the user scoping

```java
@Service
@RequiredArgsConstructor
public class XxxService {

  private final XxxRepository xxxRepository;
  private final UserRepository userRepository;
  private final SecurityContextService securityContextService;

  public List<XxxResponse> listMine() {
    UUID userId = securityContextService.getUserId();
    return xxxRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(XxxResponse::from)
        .toList();
  }

  @Transactional
  public XxxResponse create(XxxRequest request) {
    UUID userId = securityContextService.getUserId();
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

    LocalDateTime now = LocalDateTime.now();
    XxxEntity entity = XxxEntity.builder()
        .id(UUID.randomUUID())
        .user(user)
        .createdAt(now)
        .updatedAt(now)
        // ... map request fields
        .build();

    return XxxResponse.from(xxxRepository.save(entity));
  }
}
```

For updates: `findByIdAndUserId(id, userId).orElseThrow(...)`, mutate via setters, bump `updatedAt`, save.

## Response record template

```java
public record XxxResponse(UUID id, String name /* ... */) {
  public static XxxResponse from(XxxEntity entity) {
    return new XxxResponse(entity.getId(), entity.getName() /* ... */);
  }
}
```

## Validation & errors

- Put constraints on the Request record: `@NotBlank`, `@NotNull`, `@Positive`, `@Min/@Max`, `@Pattern`, `@Email`, `@Size`, `@FutureOrPresent`. Messages in Portuguese.
- `GlobalExceptionHandler` already maps: `BusinessException` → its status; `MethodArgumentNotValidException` → 400 with the **first** field error message; anything else → 500. All as `ApiError { timestamp, status, error, message, path }`. The frontend reads `error.error.message`.
- IDs are `UUID` everywhere (entities, paths, FKs). Money is `BigDecimal` (`numeric(14,2)`). Timestamps `LocalDateTime`; dates `LocalDate`.

## Security — already wired

- `SecurityConfig`: stateless, CSRF off, CORS on (origins in `config/WebConfig.java`). `/api/auth/**` and `/actuator/health` are public; everything else requires auth. `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter` and sets a `UserEntity` as the principal.
- New endpoints are authenticated by default — no annotation needed. To make one public, add a matcher in `SecurityConfig.securityFilterChain`.
- Passwords are BCrypt. JWT settings (`app.jwt.*`) come from `application.yml` / env vars.

## Flyway migration rules

- Filename `V<n>__snake_description.sql`, `n` strictly increasing (current max: `V2`). Lowercase SQL matches the existing style.
- Never edit `V1`/`V2` after they've run anywhere — add `V3`. If a dev DB drifts, recreate it: `docker compose down -v && docker compose up -d`.

## Verifying a change

Dev loop is Docker (backend on `:9091`, db on `:5433`). After editing:

```bash
docker compose up --build -d backend     # runs mvn package — compile + Flyway validate at boot
curl -s http://localhost:9091/actuator/health   # expect {"status":"UP"}
```

Then smoke-test with a real token — register, grab `accessToken`, hit the endpoint:

```bash
TOKEN=$(curl -s -X POST http://localhost:9091/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"T","email":"t@x.dev","password":"Senha123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
curl -s http://localhost:9091/api/xxx -H "Authorization: Bearer $TOKEN"
```

There is **no `mvnw`** — local Maven runs need `mvn` installed on the host. Docker is the reliable path.

## Gotchas observed in this codebase

- `AccountService.create` hardcodes `active = true` and ignores the request's `active` field; `update` honors it. Keep that asymmetry in mind.
- Registration also creates a `UserSettingsEntity` row — a user without settings will 404 on `/api/settings/profile`. New per-user side-data should be created at register time the same way.
- Enum values crossing the wire are Portuguese: sending `"INCOME"`/`"COMPLETED"` yields a 500 deserialization error. Frontend types must use `ENTRADA`/`SAIDA`, `CONCLUIDA`/`PENDENTE`.
