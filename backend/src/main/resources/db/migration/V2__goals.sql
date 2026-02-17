create table goals (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name varchar(120) not null,
  description varchar(300) not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  due_date date not null,
  created_at timestamp not null,
  updated_at timestamp not null
);

create index idx_goals_user on goals(user_id);
