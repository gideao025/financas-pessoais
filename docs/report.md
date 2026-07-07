# Relatório — Integração 100% Backend ↔ Frontend

Levantamento do que falta para o frontend consumir **integralmente** o backend (endpoints, campos de resposta e comportamentos), e onde a UI hoje usa dado derivado/mockado em vez de integração real.

Data do levantamento: 2026-07-07 · Escopo: `backend/src/main/java` × `frontend/src/app`.

---

## 1. Mapa de endpoints × consumo no frontend

| Endpoint backend | Método/serviço no front | Status |
|---|---|---|
| `POST /api/auth/register` | `auth.service.register()` | ✅ Integrado |
| `POST /api/auth/login` | `auth.service.login()` | ✅ Integrado |
| **`POST /api/auth/refresh`** | — | ❌ **Não consumido** |
| `GET /api/accounts` | `accounts.service.list()` | ✅ Integrado |
| `POST /api/accounts` | `accounts.service.create()` | ✅ Integrado |
| `PUT /api/accounts/{id}` | `accounts.service.update()` | ✅ Integrado |
| `GET /api/cards` | `cards.service.list()` | ✅ Integrado |
| `POST /api/cards` | `cards.service.create()` | ✅ Integrado |
| `PUT /api/cards/{id}` | `cards.service.update()` | ✅ Integrado |
| `POST /api/cards/{id}/toggle-block` | `cards.service.toggleBlock()` | ✅ Integrado |
| `GET /api/cards/{id}/invoice/current` | `cards.service.currentInvoice()` | ✅ Integrado |
| `GET /api/cards/{id}/invoice?month=` | `cards.service.invoice()` | ✅ Integrado |
| `GET /api/transactions` (aceita `from`/`to`) | `transactions.service.list()` | ⚠️ **Parcial** (filtros de data ignorados) |
| `POST /api/transactions` | `transactions.service.create()` | ✅ Integrado |
| `DELETE /api/transactions/{id}` | `transactions.service.delete()` | ⚠️ **Sem UI** (método existe, nenhum botão chama) |
| `GET /api/goals` | `goals.service.list()` | ✅ Integrado |
| `POST /api/goals` | `goals.service.create()` | ✅ Integrado |
| `PUT /api/goals/{id}` | `goals.service.update()` | ✅ Integrado |
| `POST /api/goals/{id}/complete` | `goals.service.complete()` | ✅ Integrado |
| `GET /api/recurrences` | `recurrences.service.list()` | ✅ Integrado |
| `POST /api/recurrences` | `recurrences.service.create()` | ✅ Integrado |
| `PUT /api/recurrences/{id}` | `recurrences.service.update()` | ✅ Integrado |
| `DELETE /api/recurrences/{id}` | `recurrences.service.delete()` | ✅ Integrado |
| `GET /api/reports/dashboard-summary` | `reports.service.dashboardSummary()` | ⚠️ **Parcial** (campos não usados) |
| `GET /api/reports/cash-flow?days=` | `reports.service.cashFlow()` | ✅ Integrado |
| `GET /api/settings/profile` | `settings.service.getProfile()` | ✅ Integrado |
| `PUT /api/settings/profile` | `settings.service.updateProfile()` | ⚠️ **Parcial** (`theme` salvo mas não aplicado) |

**Resumo:** 22/26 endpoints totalmente integrados. Os 4 pontos de atenção são o refresh de token, os filtros server-side de transações, o delete de transação sem UI e campos de resposta não exibidos.

---

## 2. Lacunas de integração (o que falta para 100%)

### 🔴 Alta prioridade

**2.1 — Refresh de token** — ✅ **CONCLUÍDO**
- ~~Existe `POST /api/auth/refresh` e o `refreshToken` é armazenado, mas nunca é usado; o interceptor faz `logout()` direto em qualquer `401`.~~
- Implementado: `auth.service.refresh()` chama o endpoint compartilhando uma única requisição entre chamadas concorrentes (`shareReplay` + `refreshInFlight`), salva o refresh token rotacionado, e o `auth.interceptor` intercepta `401`, renova e repete a requisição uma vez; só desloga se o refresh falhar. Chamadas de `/auth/*` são isentas para evitar loop.

**2.2 — Excluir transação na UI** — ✅ **CONCLUÍDO**
- ~~O serviço tem `delete()`, mas a tela de Transações não expunha a ação.~~
- Implementado: coluna de ação na tabela com botão de excluir + **confirmação inline** ("Excluir? Sim/Não"); mensagem avisa quando remove um grupo de parcelas inteiro; recarrega a lista após excluir.

### 🟡 Média prioridade

**2.3 — Filtros de data de transações server-side** — ✅ **CONCLUÍDO**
- ~~`GET /api/transactions` aceita `from`/`to`, mas `list()` chamava sem params; filtro de período era só client-side.~~
- Implementado: `transactions.service.list({ from, to })` monta `HttpParams`; a página envia o intervalo do mês corrente quando o período é "este mês" (`trocarPeriodo` recarrega do servidor). "Todos" segue sem params.

**2.4 — Campos de `dashboard-summary` exibidos** — ✅ **CONCLUÍDO**
- ~~`totalIncome`, `totalExpense`, `pendingCount`, `completedCount` chegavam mas não apareciam.~~
- Implementado: faixa de 4 métricas na tela de Relatórios (total de entradas, total de saídas, transações concluídas e pendentes).

**2.5 — Preferências de `settings/profile`** — ✅ **RESOLVIDO (dark-fixo)**
- Decisão de produto: manter o app **dark-only** por ora. Corrigido: o save persistia `theme` defaultando para `'light'` (inconsistente) — agora persiste `'dark'`.
- `monthlySummary`, `lowBalanceAlert`, `securityAlert` continuam **integrados na persistência** (carregam e salvam). Dar efeito real aos alertas (job/notificação) é **feature nova de backend**, fora do escopo de integração — ver §4.

### 🟢 Baixa prioridade / cosmético

**2.6 — Sub-linhas e header decorativos no Dashboard**
- KPIs têm textos fixos não derivados de dado: "soma das contas", "contas fixas + faturas".
- O header do protótipo (busca global, sino de notificações, botão "Adicionar") não foi implementado — mantido um header simples.
- **Ação:** derivar as sub-linhas de dados reais (ou remover) e, se desejado, implementar busca/notificações (exigem endpoints novos — ver §4).

---

## 3. Onde a UI usa dado mockado/derivado (não é integração real)

| Local | O que é mock/derivado | Observação |
|---|---|---|
| **Dashboard (Início)** | Fallback de demonstração (`demoFluxo`/`demoMetas`) quando o backend retorna vazio | Intencional, a pedido; usa dado **real** automaticamente quando existe. Para 100% real, popular via seed (`V5__seed_dados_reais.sql`) ou cadastro. |
| **Sidebar "Fim do mês"** | Valor `R$ 1.400` de demonstração quando não há fluxo | Usa o `cash-flow` real quando há eventos. |
| **Sidebar "Plano Pro"** | Rótulo fixo | Não existe conceito de plano no backend. |
| **Relatórios — "Gastos por categoria"** | No protótipo existe; **não há endpoint** que agregue por categoria | Ver §4.1. Hoje a tela mostra série mensal real (income/expense), não categorias. |

---

## 4. Funcionalidades do protótipo/UI que exigem backend novo

Estas não são "integração faltando" — o endpoint **não existe** e precisaria ser criado para fechar 100% do que a UI sugere:

**4.1 — Agregação de gastos por categoria** (`GET /api/reports/by-category?month=`) — ✅ **CONCLUÍDO**
- Backend: `ReportService.expensesByCategory(month)` + DTO `CategoryReportItem` + endpoint `GET /api/reports/by-category` (mês opcional, default mês corrente; agrupa SAÍDAS por categoria, ordenado desc).
- Front: `reports.service.byCategory()` + card "Gastos por categoria" com barras na tela de Relatórios.

**4.2 — Edição de transação** (`PUT /api/transactions/{id}`) — ✅ **CONCLUÍDO**
- Backend: `TransactionService.update()` + `PUT /api/transactions/{id}`. Parcelas (grupo) **não** são editáveis (rejeita com mensagem clara).
- Front: `transactions.service.update()`, botão **editar** na linha (oculto para parcelas), painel reaproveitado para criar/editar.

**4.3 — Busca global / notificações** (header do protótipo)
- Sem endpoints de busca cross-recurso nem de notificações. Puramente visual por enquanto. **Pendente.**

---

## 5. Consistência de contratos (DTOs)

Os modelos do front (`core/models/api.models.ts`) batem com os records do backend nos recursos verificados (auth, accounts, cards, transactions, goals, recurrences, reports, settings). Não foram encontradas divergências de campos nos endpoints consumidos.

Observação: o `CLAUDE.md` cita `GET/PATCH /api/settings`, mas o real é `GET/PUT /api/settings/profile` — vale alinhar a documentação.

---

## 6. Priorização sugerida

| # | Item | Tipo | Esforço |
|---|---|---|---|
| 1 | ~~Refresh de token (§2.1)~~ ✅ concluído | Integração | M |
| 2 | ~~Excluir transação na UI (§2.2)~~ ✅ concluído | Integração | P |
| 3 | ~~Filtros `from`/`to` server-side (§2.3)~~ ✅ concluído | Integração | P |
| 4 | ~~Exibir campos de `dashboard-summary` (§2.4)~~ ✅ concluído | Integração | P |
| 5 | ~~Decidir/aplicar `theme` e alertas (§2.5)~~ ✅ dark-fixo | Produto | P–M |
| 6 | ~~Endpoint de gastos por categoria (§4.1)~~ ✅ concluído | Backend novo | M |
| 7 | ~~Editar transação (§4.2)~~ ✅ concluído | Backend + front | M |
| 8 | Busca/notificações (§4.3) | Backend novo | G |

**Conclusão:** a integração do que já existia está **100% fechada** (itens 1–5), e as duas features novas de maior valor — **gastos por categoria** e **edição de transação** — foram implementadas no backend e no front (itens 6–7). Resta apenas o item 8 (busca global / notificações), que depende de endpoints ainda inexistentes e é majoritariamente cosmético.
