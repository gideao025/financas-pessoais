-- Materialização de recorrências como transações do mês (contas a pagar).
-- Liga a transação à recorrência que a originou e guarda vencimento + competência (YYYY-MM).

alter table transactions
  add column recurrence_id uuid references recurrences(id) on delete set null,
  add column due_date date,
  add column competence varchar(7);

-- evita gerar a mesma conta fixa duas vezes no mesmo mês
create unique index uq_transactions_recurrence_competence
  on transactions (recurrence_id, competence)
  where recurrence_id is not null;

create index idx_transactions_recurrence on transactions (recurrence_id);
