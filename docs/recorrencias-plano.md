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

### Fase 2 — Pagamento parcial  ·  **M**
- **Migration**: `paid_amount numeric(14,2)` na transação; novo status `PARCIAL`.
- **Backend**: registrar `paid_amount < amount` → status `PARCIAL`; o **efeito no saldo passa a
  usar `paid_amount`**, não o valor cheio (ajuste na lógica de saldo atual, que hoje usa o total).
- **Front**: input de valor pago + exibição "pago X de Y".

### Fase 3 — Atraso e rollover  ·  **M–G (depende de regra de negócio)**
Parte mais aberta; exige **decisões de produto** antes de estimar com precisão.

- Status `ATRASADA` (ou derivar de `due_date < hoje && não quitada`).
- **Rollover**: o saldo não pago vira cobrança no mês seguinte? Como item novo ligado ao
  original, ou o mesmo item que permanece em aberto?
- **Custo por atraso**: multa fixa? percentual? juros por dia? Isso vira campo(s) na recorrência
  (ex.: `late_fee`, `interest_rate`) + lógica de cálculo na virada/consulta.
- **Cash-flow**: refletir atrasado + multa na projeção.

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

| Fase | Entrega | Esforço | Bloqueio |
|---|---|---|---|
| 1 | Conta fixa vira lançamento do mês; pago/pendente | **M** | — |
| 2 | Pagamento parcial | **M** | — |
| 3 | Atraso + rollover + multa/juros | **M–G** | precisa das 4 decisões de produto |

Recomendação: fazer a **Fase 1** primeiro (resolve 80% da dor: ver e marcar o que já foi pago),
validar, e só então Fase 2/3 conforme as regras de atraso forem definidas.
