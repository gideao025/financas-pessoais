-- Ciclo de fatura do cartão e parcelamento de transações

-- dia de fechamento da fatura (default 1 para cartões já existentes)
alter table cards add column closing_day integer not null default 1;

-- parcelamento: transações de uma mesma compra parcelada compartilham o group_id
alter table transactions add column installment_group_id uuid;
alter table transactions add column installment_number integer;
alter table transactions add column installment_total integer;

-- consulta de fatura: transações de um cartão dentro de um período
create index idx_transactions_card_date on transactions(card_id, transaction_date);
