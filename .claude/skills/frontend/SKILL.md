---
name: frontend
description: Conventions and templates for the Angular 21 frontend of Finanças Pessoais. Use when creating or editing pages, services, models, guards, or interceptors under frontend/src/app — adding a feature screen, wiring a component to a backend endpoint, or following the project's signal/Tailwind patterns.
---

# Frontend — Finanças Pessoais

Angular 21 standalone app, signals-based state, Tailwind CSS, `pt-BR` locale, JWT auth. Talks to the Spring Boot backend documented in the root `CLAUDE.md`.

## Golden rules

- **Standalone components only.** No NgModules. Declare deps in the `imports` array.
- **State is signals.** Use `signal()`, `computed()`, `inject()`. No `@Input`/`@Output` ceremony for page state, no RxJS `BehaviorSubject` stores.
- **Never call `HttpClient` from a component.** Components inject a service from `core/services/`; services own the URLs.
- **Never import from `mocks/finance.mock.ts`.** It is dead code kept only for reference. Real data comes from services. A page that still imports it is not done.
- **Portuguese for domain/UI naming** (`carregando`, `salvar`, `metas`), English for Angular/framework plumbing (`ngOnInit`, `inject`). Match what's already in the file.
- **Backend enums are Portuguese-uppercase:** `ENTRADA`/`SAIDA`, `CONCLUIDA`/`PENDENTE`. Account/card brand strings are free text. Always map API ↔ UI explicitly (see the mapTransaction pattern).

## Directory map

```
frontend/src/app/
├── core/
│   ├── api.config.ts          # resolveApiBaseUrl() — port-aware base URL
│   ├── models/api.models.ts    # ALL DTO interfaces (Request/Response) live here
│   ├── auth/
│   │   ├── auth.guard.ts        # authGuard — protects routes
│   │   └── auth.interceptor.ts  # injects Bearer, logs out on 401
│   └── services/                # one service per backend domain
├── pages/<feature>-page/        # routed screens (component.ts + .html + .scss)
├── layouts/shell-layout/        # authenticated chrome (sidebar + top-nav + <router-outlet>)
├── components/                  # shared presentational pieces
└── mocks/finance.mock.ts        # DEAD — do not import
```

## Adding a feature, end to end

1. **Types** → add `XxxResponse` / `XxxRequest` interfaces to `core/models/api.models.ts`. Mirror the backend record field names exactly (camelCase).
2. **Service** → create `core/services/xxx.service.ts` returning `Observable`s (template below).
3. **Page** → component holds signals + calls the service in `ngOnInit`; template renders loading/erro/empty/data states.
4. **Route** → register in `app.routes.ts` as a child of `ShellLayoutComponent` (so it's behind `authGuard`), unless it's public like `/auth`.
5. **Verify** → rebuild the container and smoke-test the endpoint. See "Verifying".

## Service template

`resolveApiBaseUrl()` already returns the `/api` base — never hardcode `http://localhost`.

```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { resolveApiBaseUrl } from '../api.config';
import type { XxxRequest, XxxResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class XxxService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = resolveApiBaseUrl();

  list(): Observable<XxxResponse[]> {
    return this.http.get<XxxResponse[]>(`${this.apiBaseUrl}/xxx`);
  }

  create(payload: XxxRequest): Observable<XxxResponse> {
    return this.http.post<XxxResponse>(`${this.apiBaseUrl}/xxx`, payload);
  }
}
```

## Page component template

Every data page carries the same trio of signals: `carregando`, `erro`, `mensagem`. Use `forkJoin` when a screen needs several endpoints at once (see `dashboard-overview-page` and `transactions-page`).

```ts
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { XxxResponse } from '../../core/models/api.models';
import { XxxService } from '../../core/services/xxx.service';

@Component({
  selector: 'app-xxx-page',
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './xxx-page.component.html',
  styleUrl: './xxx-page.component.scss'
})
export class XxxPageComponent implements OnInit {
  private readonly xxxService = inject(XxxService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly itens = signal<XxxResponse[]>([]);

  ngOnInit(): void {
    this.carregarDados();
  }

  protected carregarDados(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.xxxService.list().subscribe({
      next: (itens) => {
        this.itens.set(itens);
        this.carregando.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.carregando.set(false);
        this.erro.set(error.error?.message ?? 'Nao foi possivel carregar os dados.');
      }
    });
  }
}
```

Conventions baked in above:
- Signals are `protected readonly` (template-visible, not public API), services `private readonly`.
- Error handler reads `error.error?.message` — the backend's `GlobalExceptionHandler` returns `{ message, status, ... }`.
- Success feedback: `this.mensagem.set('...')` then `setTimeout(() => this.mensagem.set(''), 2500)`.
- Map API enums to UI shapes in a private `mapXxx()` method rather than leaking `ENTRADA`/`CONCLUIDA` into the template.

## Template (HTML) conventions

- Bind inputs with signals: `[value]="nome()"` + `(input)="nome.set($any($event.target).value)"`. This codebase uses signal-setters, **not** `[(ngModel)]` / `FormsModule`.
- Always render four states in order: **erro** (red box), **mensagem** (green box), **carregando** (skeleton/text), then data — guarded with `*ngIf` / empty-state `*ngIf="!carregando() && !itens().length"`.
- Money: `{{ v | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}`. Percent: `{{ v | percent: '1.1-1' : 'pt-BR' }}`.
- Tailwind palette in use: `bg-primary` / `text-primary` for accent, `text-[#64748b]` muted, card shells `rounded-xl border border-[#e5e7eb] bg-white dark:border-[#2a3441] dark:bg-[#1a242f]`. Keep dark-mode classes paired.
- Wrap the screen in `<section class="mx-auto flex w-full max-w-6xl flex-col gap-6">`.

## Auth — already wired, don't reinvent

- `authInterceptor` (registered in `app.config.ts`) attaches `Authorization: Bearer <token>` to every request and calls `authService.logout(false)` + redirects to `/auth` on a 401. New services need no auth code.
- `AuthService` persists the session in `localStorage` under key `financas.session` and exposes `session`, `isAuthenticated`, `getAccessToken()`. Read auth state from it; never touch `localStorage` directly.
- Routes needing login go under the `ShellLayoutComponent` children in `app.routes.ts` (covered by `authGuard`). Public routes sit at the top level.

## Verifying a change

The dev loop here is Docker (frontend served by nginx on `:9090`, backend on `:9091`). After editing:

```bash
docker compose up --build -d frontend   # rebuild runs the prod ng build — catches TS/template errors
```

A clean build means types and templates compile. Then smoke-test the backend endpoint with a real token (register → grab `accessToken` → call the endpoint) and, when possible, drive the UI at `http://localhost:9090`. See the root `CLAUDE.md` for the full curl recipe.

## Gotchas observed in this codebase

- Backend `POST /api/accounts` ignores the request's `active` flag and always creates active — don't rely on sending it.
- There is **no** "linked banks" endpoint; the old settings mock for it was dropped. Don't re-add UI for endpoints that don't exist — check the backend controller first.
- `resolveApiBaseUrl()` switches base URL by `window.location.port`: `9090` → backend `9091`, anything else → `8080`. Local `ng serve` (4200) therefore expects the backend on 8080.
