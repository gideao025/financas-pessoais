# Análise do projeto — o que falta e próximos passos

Panorama do estado atual e backlog priorizado. Atualizado após o hardening de segurança
(perfis dev/hmlg/prd, JWT, 401 no login).

## 🔴 Segurança / produção

O app está exposto na internet (`finance.gideaolucas.com.br`), então isto é prioridade.

| # | Item | Status |
|---|---|---|
| 1 | `JWT_SECRET` default | ✅ **resolvido** — em `prd` o app recusa subir com o default (`ProductionSecurityGuard`). Ver `deploy.md`. |
| 2 | Seed com usuário/senha conhecidos rodando em prod | ✅ **resolvido** — seed movido para `db/seed`, carregado só em dev/hmlg. ⚠️ **Ação manual pendente:** o usuário do seed já existe no banco da docker-vm (o V5 rodou antes); trocar a senha ou remover (ver `deploy.md`). |
| 3 | Senha do Postgres hardcoded | ✅ **resolvido** — vem de `DB_PASSWORD` no `.env`. |
| 4 | Login com credencial errada retornava 500 | ✅ **resolvido** — agora 401. |
| 5 | Sem rate limiting no login (força bruta) | ⛔ pendente — delegar ao Cloudflare (WAF/rate limit) ou filtro simples. |
| 6 | HTTPS | ✅ terminado no Cloudflare. |

## 🟡 Qualidade e confiabilidade

| # | Item | Nota |
|---|---|---|
| 7 | **Cobertura de testes ~zero** (0 backend, 1 spec front) | Maior risco de regressão. A lógica de saldo, parcelas, materialização de recorrências e cash-flow foi validada só por curl. Melhor ROI: testes de serviço no backend. |
| 8 | **Sem CI** | GitHub Action com `mvn test` + `ng build` a cada push. |
| 9 | Sem `mvnw` | `mvn wrapper:wrapper` para não depender de Maven no host. |

## 🟢 Funcionalidades / produto

| # | Item |
|---|---|
| 10 | Busca global e notificações do header do protótipo (não há endpoints; hoje decorativo) — item 8 do `report.md`. |
| 11 | "Desfazer pagamento" (estorno em um clique). |
| 12 | Categorias como texto livre (sem cadastro/padronização). |
| 13 | Editar transação parcial reseta `paid_amount` (limitação herdada da Fase 2). |
| 14 | Filtros/paginação de transação client-side (só data é server-side) — não escala. |

## ⚪ Refinamentos visuais / UX (opcional)

| # | Item |
|---|---|
| 15 | Header do app ≠ header do protótipo (busca, sino, "Adicionar", toggle de tema). |
| 16 | Light mode foi descartado (dark-only); o protótipo tinha o toggle. |
| 17 | Estados de vazio mais amigáveis em algumas telas. |

## Próximos passos recomendados (ordem)

1. **Concluir o hardening operacional** na docker-vm: gerar `JWT_SECRET`, subir com `prd`, e
   **trocar/remover o usuário do seed** que já está no banco (ver `deploy.md`).
2. **Testes de backend + CI** (itens 7–8): travar as regras de saldo/recorrências.
3. Escolher a próxima feature de produto (11–14) conforme a necessidade de uso.
