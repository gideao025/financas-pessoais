create table users (
  id uuid primary key,
  full_name varchar(120) not null,
  email varchar(180) not null unique,
  password_hash varchar(255) not null,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table refresh_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(255) not null,
  expires_at timestamp not null,
  revoked boolean not null default false,
  created_at timestamp not null
);

create table accounts (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name varchar(120) not null,
  type varchar(30) not null,
  institution varchar(120) not null,
  balance numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table cards (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  name varchar(120) not null,
  brand varchar(40) not null,
  last_four varchar(4) not null,
  credit_limit numeric(14,2) not null,
  used_limit numeric(14,2) not null default 0,
  due_day integer not null,
  blocked boolean not null default false,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table transactions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  card_id uuid references cards(id) on delete set null,
  description varchar(180) not null,
  category varchar(80) not null,
  transaction_type varchar(20) not null,
  status varchar(20) not null,
  amount numeric(14,2) not null,
  transaction_date date not null,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  monthly_summary boolean not null default true,
  low_balance_alert boolean not null default false,
  security_alert boolean not null default true,
  theme varchar(10) not null default 'light',
  updated_at timestamp not null
);

create index idx_accounts_user on accounts(user_id);
create index idx_cards_user on cards(user_id);
create index idx_transactions_user_date on transactions(user_id, transaction_date desc);
create index idx_transactions_user_type on transactions(user_id, transaction_type);
