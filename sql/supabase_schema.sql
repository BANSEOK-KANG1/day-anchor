-- Day Anchor Supabase Schema
-- 1차 프로토타입의 localStorage 구조를 Supabase로 옮길 때 사용할 수 있는 기본 스키마입니다.

create extension if not exists "uuid-ossp";

create table if not exists public.days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  main_goal text,
  avoid_text text,
  focus_window text,
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  title text not null,
  start_time time not null,
  end_time time not null,
  block_type text not null default 'Deep Work',
  status text not null default 'planned' check (status in ('planned', 'doing', 'done', 'skipped')),
  memo text,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'done', 'skipped', 'carried')),
  priority int default 0,
  carried_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  content text,
  note_type text not null default 'text' check (note_type in ('text', 'voice')),
  created_at timestamptz not null default now()
);

create table if not exists public.voice_memos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  file_url text not null,
  duration_sec int,
  transcript text,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  remind_time time not null,
  prompt text not null,
  fired boolean not null default false,
  fired_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid references public.days(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_days_user_date on public.days(user_id, date);
create index if not exists idx_schedule_blocks_day on public.schedule_blocks(day_id, start_time);
create index if not exists idx_tasks_day_status on public.tasks(day_id, status);
create index if not exists idx_notes_day_created on public.notes(day_id, created_at desc);
create index if not exists idx_activity_events_user_created on public.activity_events(user_id, created_at desc);

alter table public.days enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.voice_memos enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_events enable row level security;

create policy "days owner access" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "schedule_blocks owner access" on public.schedule_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks owner access" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes owner access" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "voice_memos owner access" on public.voice_memos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders owner access" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity_events owner access" on public.activity_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
