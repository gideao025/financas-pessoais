# Levantamento — Recorrências como "contas a pagar" do mês

Objetivo: fazer as recorrências (salário, aluguel, contas fixas) **materializarem** na lista
de transações do mês, para poder marcar **pago / pendente / parcial** e tratar **atraso /
rollover** para o mês seguinte.

## Estado atual

| Conceito | Hoje |
|---|---|
| `recurrences` | Tabela própria; descreve o lançamento fixo (tipo, valor, `day_of_month`). **Não vira transação.** |
| Uso das recorrências | `CashFlowService` expande em memória como eventos **de projeção** (só para o gráfico). |
| `transactions` | Registro real; status `CONCLUIDA | PENDENTE`; afeta o saldo quando concluída. |
| Vínculo recorrência ↔ transação | **Não existe.** |
| Pagamento parcial / atraso / juros | **Não existe** nenhum conceito. |

Consequência: a conta fixa do mês não é um lançamento gerenciável — é apenas uma linha de
projeção. Não há onde marcar "paga", "falta pagar", "paguei metade" ou "atrasou".

## Abordagem recomendada

**Materializar** cada recorrência ativa em uma **transação-instância por mês (competência)**,
vinculada à recorrência. Assim ela aparece na lista com status `PENDENTE` e pode ser marcada
como paga (total ou parcial). Geração **sob demanda** (ao abrir o mês / endpoint dedicado),
sem precisar de job agendado no começo.

Alternativa descartada: manter recorrência só como projeção e criar uma segunda tela de
"contas a pagar" — duplica conceito e navegação.

## Esforço por fase

### Fase 1 — Materializar + pago/pendente  ·  **M**
O que já resolve "quais já paguei / quais faltam".

- **Migration V6**: em `transactions`, adicionar `recurrence_id uuid null` (FK), `due_date date`,
  `competence varchar(7)` (YYYY-MM) e índice único `(recurrence_id, competence)` para não duplicar.
- **Backend**: serviço idempotente que, para um mês, cria a transação faltante de cada
  recorrência ativa (`due_date` a partir do `day_of_month`, status `PENDENTE`, valor da
  recorrência). Endpoint `POST /api/recurrences/generate?month=YYYY-MM` (ou gerar ao listar o mês).
- **Backend**: ação "marcar como paga" (já existe `PENDENTE→CONCLUIDA` via `PUT`; falta o efeito
  correto no saldo na data do pagamento).
- **Cash-flow**: **evitar dupla contagem** — parar de projetar a recorrência nos meses em que
  já existe a transação materializada. (Ponto de correção mais delicado desta fase.)
- **Front**: badge de origem (recorrente) e status na lista; botão "pagar".

### Fase 2 — Pagamento parcial  ·  **M**  ·  ✅ **CONCLUÍDA**
- **Migration V7**: `paid_amount numeric(14,2)` (backfill = `amount` para `CONCLUIDA`); status `PARCIAL`.
- **Backend**: `POST /api/transactions/{id}/pay` aceita `{amount}` opcional (ausente = quita o
  restante); status vira `PARCIAL` enquanto faltar, `CONCLUIDA` ao quitar. O **efeito no saldo passou
  a usar `paid_amount`** (modelo unificado: cada pagamento debita só a parcela paga).
- **Front**: badge "parcial · pago X de Y" + input inline de pagamento (total ou parcial).

### Fase 3 — Atraso  ·  ✅ **CONCLUÍDA (versão simplificada)**
Decisões de produto tomadas: (1) **só sinaliza**, sem custo automático; (2) **sem multa/juros** —
a diferença é lançada manualmente ao pagar; (3) o valor em aberto **continua no mesmo lançamento**.

Resultado: **nenhuma migration nem mudança de backend**. "Atrasada" é derivada no front
(`pendente/parcial` + `vencimento < hoje`).
- Badge "atrasada · venceu dd/MM" (+ "resta X" se parcial), em vermelho.
- Filtro "Situação" (todas / a pagar / atrasadas / pagas); "Atrasadas" força período "todos"
  para trazer vencidas de meses anteriores.

Fora de escopo por decisão do produto: rollover automático, multa/juros e reflexo no cash-flow.

## Decisões de produto necessárias (antes da Fase 3)

1. **Atraso**: só sinalizar, ou gerar custo automático?
2. **Multa/juros**: modelo (fixa / % / por dia)?
3. **Rollover**: valor em aberto migra como nova cobrança ou permanece o mesmo lançamento?
4. **Geração**: sob demanda (ao abrir o mês) ou job agendado (dia 1º)?

## Riscos técnicos

- **Dupla contagem no cash-flow** (recorrência projetada + transação materializada) — precisa de
  reconciliação cuidadosa; é o principal risco de correção.
- **Lógica de saldo**: hoje aplica o valor cheio quando `CONCLUIDA`; pagamento parcial muda essa
  base para `paid_amount`.
- **Idempotência da geração**: sem a unique key, reabrir o mês duplicaria contas.

## Resumo

| Fase | Entrega | Esforço | Status |
|---|---|---|---|
| 1 | Conta fixa vira lançamento do mês; pago/pendente | **M** | ✅ concluída |
| 2 | Pagamento parcial | **M** | ✅ concluída |
| 3 | Atraso (só sinaliza) | **P** | ✅ concluída |

Recomendação: fazer a **Fase 1** primeiro (resolve 80% da dor: ver e marcar o que já foi pago),
validar, e só então Fase 2/3 conforme as regras de atraso forem definidas.
