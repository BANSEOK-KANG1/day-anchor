-- Day Anchor Supabase schema draft
-- MVP 확장 시 Supabase SQL Editor에서 실행할 수 있는 기본 구조입니다.

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  main_goal text,
  avoid_thing text,
  focus_window text,
  review_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid references public.days(id) on delete cascade,
  date date not null,
  title text not null,
  start_time time not null,
  end_time time not null,
  block_type text not null default 'deep_work',
  status text not null default 'planned',
  memo text,
  delay_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid references public.days(id) on delete cascade,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  date date not null,
  title text not null,
  status text not null default 'todo',
  priority int not null default 2,
  due_time time,
  delay_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid references public.days(id) on delete cascade,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  date date not null,
  content text,
  note_type text not null default 'text',
  voice_memo_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.voice_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete cascade,
  file_path text not null,
  duration_sec int,
  transcript text,
  created_at timestamptz not null default now()
);

alter table public.notes
  add constraint notes_voice_memo_fk
  foreign key (voice_memo_id) references public.voice_memos(id) on delete set null;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid references public.days(id) on delete cascade,
  date date not null,
  reminder_time time not null,
  message text not null,
  triggered boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.days enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.voice_memos enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_events enable row level security;

create policy "users can manage own days" on public.days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own schedule blocks" on public.schedule_blocks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own voice memos" on public.voice_memos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own reminders" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage own activity events" on public.activity_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_days_user_date on public.days(user_id, date desc);
create index if not exists idx_schedule_blocks_user_date on public.schedule_blocks(user_id, date, start_time);
create index if not exists idx_tasks_user_date on public.tasks(user_id, date, status);
create index if not exists idx_notes_user_date on public.notes(user_id, date, created_at desc);
create index if not exists idx_events_user_created_at on public.activity_events(user_id, created_at desc);
