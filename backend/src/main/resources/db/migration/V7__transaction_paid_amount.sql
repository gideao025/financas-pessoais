-- Pagamento parcial: quanto ja foi pago de uma transacao (conta a pagar).
-- status pode ser PENDENTE | PARCIAL | CONCLUIDA (coluna e varchar, sem check).

alter table transactions add column paid_amount numeric(14,2) not null default 0;

-- transacoes ja concluidas contam como totalmente pagas (mantem o saldo coerente)
update transactions set paid_amount = amount where status = 'CONCLUIDA';
