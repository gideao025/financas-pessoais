-- Lançamentos recorrentes (salários, contas fixas) para projeção de fluxo de caixa

create table recurrences (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  description varchar(180) not null,
  category varchar(80) not null,
  transaction_type varchar(20) not null,   -- ENTRADA | SAIDA
  amount numeric(14,2) not null,
  day_of_month integer not null,           -- 1..31 (trunca ao último dia do mês)
  active boolean not null default true,
  created_at timestamp not null,
  updated_at timestamp not null
);

create index idx_recurrences_user on recurrences(user_id);
