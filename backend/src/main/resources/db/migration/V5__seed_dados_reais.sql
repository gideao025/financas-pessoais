-- =============================================================
-- V5__seed_dados_reais.sql
-- Dados iniciais reais — Gideão & Sara · Jun/2026
-- Executar apenas em ambiente de desenvolvimento/local.
-- =============================================================

-- ── 1. USUÁRIO ────────────────────────────────────────────────
-- senha: financas123
insert into users (id, full_name, email, password_hash, created_at, updated_at)
values (
  '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
  'Gideão Lucas de Souza Silva',
  'gideao@email.com',
  '$2a$10$fC5jaF5Uai1ew1D6wEaSPegQzm22ny3ar5MNxHd//04XzO55tTQFa',
  now(), now()
) on conflict do nothing;

-- ── 2. CONTAS ─────────────────────────────────────────────────
-- AccountType enum: CHECKING | SAVINGS | WALLET | INVESTMENT
insert into accounts (id, user_id, name, type, institution, balance, active, created_at, updated_at)
values
  ('a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Bradesco — Gideão', 'CHECKING', 'Bradesco', 0.00, true, now(), now()),

  ('3a7f69a3-16b5-0823-b8b3-94197ff440f3',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Inter — Gideão', 'CHECKING', 'Banco Inter', 0.00, true, now(), now()),

  ('f1c2d3e4-aaaa-bbbb-cccc-111111111111',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Inter — Sara', 'CHECKING', 'Banco Inter', 0.00, true, now(), now()),

  ('f1c2d3e4-aaaa-bbbb-cccc-222222222222',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Santander — Gideão', 'CHECKING', 'Santander', 0.00, true, now(), now()),

  ('f1c2d3e4-aaaa-bbbb-cccc-333333333333',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Santander — Sara', 'CHECKING', 'Santander', 0.00, true, now(), now()),

  ('f1c2d3e4-aaaa-bbbb-cccc-444444444444',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Nubank — Sara', 'CHECKING', 'Nubank', 0.00, true, now(), now()),

  ('f1c2d3e4-aaaa-bbbb-cccc-555555555555',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Mercado Pago — Gideão', 'CHECKING', 'Mercado Pago', 0.00, true, now(), now()),

  ('8ded3f6c-2393-bbcf-ea68-9152de4c3579',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Caixa Casa', 'WALLET', 'Virtual', 0.00, true, now(), now())
on conflict do nothing;

-- ── 3. CARTÕES ────────────────────────────────────────────────
-- due_day = dia de vencimento | closing_day = dia de fechamento
insert into cards (id, user_id, account_id, name, brand, last_four, credit_limit, used_limit, due_day, closing_day, blocked, created_at, updated_at)
values
  ('aa702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   '3a7f69a3-16b5-0823-b8b3-94197ff440f3',
   'Inter Gideão', 'MASTERCARD', '0000', 10000.00, 3236.16, 7, 1, false, now(), now()),

  ('bb702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Bradesco Gideão', 'VISA', '0000', 5000.00, 159.41, 10, 3, false, now(), now()),

  ('cc702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-222222222222',
   'Santander Gideão', 'MASTERCARD', '0000', 3000.00, 186.35, 8, 1, false, now(), now()),

  ('dd702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-555555555555',
   'Mercado Pago Gideão', 'MASTERCARD', '0000', 3000.00, 158.29, 10, 3, false, now(), now()),

  ('ee702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-111111111111',
   'Inter Sara', 'MASTERCARD', '0000', 8000.00, 1852.57, 7, 1, false, now(), now()),

  ('ff702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-333333333333',
   'Santander Sara', 'VISA', '0000', 3000.00, 703.02, 8, 1, false, now(), now()),

  ('a0702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-444444444444',
   'Nubank Sara', 'MASTERCARD', '0000', 5000.00, 1435.94, 10, 3, false, now(), now()),

  ('b0702d22-f3dc-4334-72e1-136d6c012273',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   null,
   'Renner Sara', 'VISA', '0000', 1000.00, 110.08, 15, 8, false, now(), now())
on conflict do nothing;

-- ── 4. RECORRÊNCIAS ───────────────────────────────────────────
-- transaction_type: ENTRADA | SAIDA
insert into recurrences (id, user_id, account_id, description, category, transaction_type, amount, day_of_month, active, created_at, updated_at)
values
  -- ENTRADAS
  ('a0000001-0000-0000-0000-000000000001',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Salário Gideão (saldo holerite)', 'Salário', 'ENTRADA', 1928.94, 30, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000002',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Adiantamento quinzenal Gideão', 'Salário', 'ENTRADA', 2903.68, 15, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000003',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-111111111111',
   'Salário Sara (líquido)', 'Salário', 'ENTRADA', 1710.49, 30, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000004',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Renda extra suporte TI', 'Renda Extra', 'ENTRADA', 1000.00, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000005',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   '8ded3f6c-2393-bbcf-ea68-9152de4c3579',
   'Vale Refeição + Vale Alimentação Gideão', 'Benefícios', 'ENTRADA', 1340.65, 5, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000006',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   '8ded3f6c-2393-bbcf-ea68-9152de4c3579',
   'Vale Alimentação Sara', 'Benefícios', 'ENTRADA', 650.00, 5, true, now(), now()),

  -- SAÍDAS
  ('a0000001-0000-0000-0000-000000000010',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Aluguel + Luz + Água', 'Moradia', 'SAIDA', 850.00, 5, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000011',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Internet (Likelink)', 'Moradia', 'SAIDA', 99.90, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000012',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Financiamento carro (2/60)', 'Transporte', 'SAIDA', 983.40, 15, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000013',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Acordo Nubank (17/36)', 'Dívidas', 'SAIDA', 394.13, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000014',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Empréstimo conserto carro (2/10)', 'Dívidas', 'SAIDA', 512.00, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000015',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Fiap pós-graduação (líquido 50%)', 'Educação', 'SAIDA', 367.50, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000016',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'a7b0e9a3-dc81-5fbc-3b1c-d78a35af508b',
   'Fotos formatura (parcelado)', 'Educação', 'SAIDA', 183.33, 10, true, now(), now()),

  ('a0000001-0000-0000-0000-000000000017',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'f1c2d3e4-aaaa-bbbb-cccc-111111111111',
   'Consignado Sara (desc. holerite)', 'Dívidas', 'SAIDA', 568.71, 30, true, now(), now())
on conflict do nothing;

-- ── 5. METAS ──────────────────────────────────────────────────
insert into goals (id, user_id, name, description, target_amount, current_amount, due_date, created_at, updated_at)
values
  ('b0000001-0000-0000-0000-000000000001',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Reserva de emergência',
   'Meta: 1 salário (~R$7.500). Evitar novos empréstimos em emergências como o conserto do carro.',
   7543.00, 0.00, '2027-06-30', now(), now()),

  ('b0000001-0000-0000-0000-000000000002',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Caixa de ferramentas',
   'Kit completo para casa, Tiida e Vectra. Meta estimada R$1.500.',
   1500.00, 0.00, '2027-12-31', now(), now()),

  ('b0000001-0000-0000-0000-000000000003',
   '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
   'Quitar Acordo Nubank',
   '~20 parcelas restantes x R$394 = ~R$7.880. Antecipar libera R$394/mes a partir de Fev/2028.',
   10832.76, 5900.00, '2028-02-28', now(), now())
on conflict do nothing;

-- ── 6. CONFIGURAÇÕES DO USUÁRIO ───────────────────────────────
insert into user_settings (user_id, monthly_summary, low_balance_alert, security_alert, theme, updated_at)
values (
  '2c1bfef2-ccce-f474-6cd3-c3244141ec66',
  true, true, true, 'light', now()
) on conflict do nothing;
