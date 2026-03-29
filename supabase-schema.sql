-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Tasks table
create table if not exists tasks (
  id text primary key,
  title text not null,
  estimated_pomodoros int default 1,
  completed_pomodoros int default 0,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  mode text not null,
  duration int not null,
  completed_at timestamptz not null
);

-- Settings table (singleton row)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  focus int default 25,
  short int default 5,
  long int default 15,
  long_break_interval int default 4,
  auto_start_breaks boolean default false,
  auto_start_pomodoros boolean default false,
  updated_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id) values (1) on conflict do nothing;

-- Enable realtime for all tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table settings;

-- Auto-update updated_at on tasks
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger settings_updated_at
  before update on settings
  for each row execute function update_updated_at();

-- Enable Row Level Security (open access with anon key for personal use)
alter table tasks enable row level security;
alter table sessions enable row level security;
alter table settings enable row level security;

create policy "Allow all on tasks" on tasks for all using (true) with check (true);
create policy "Allow all on sessions" on sessions for all using (true) with check (true);
create policy "Allow all on settings" on settings for all using (true) with check (true);
