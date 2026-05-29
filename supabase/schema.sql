-- Day Anchor Supabase Schema (production, idempotent)
-- Supabase Dashboard → SQL Editor → New query → 전체 붙여넣기 → Run

create extension if not exists "uuid-ossp";

create table if not exists public.days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  main_goal text,
  avoid_text text,
  focus_window text,
  review_text text,
  review_completed boolean not null default false,
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
  block_type text not null default 'deep_work',
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
  priority int default 2,
  due_time time,
  delay_reason text,
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

drop policy if exists "days owner access" on public.days;
create policy "days owner access" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "schedule_blocks owner access" on public.schedule_blocks;
create policy "schedule_blocks owner access" on public.schedule_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks owner access" on public.tasks;
create policy "tasks owner access" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes owner access" on public.notes;
create policy "notes owner access" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "voice_memos owner access" on public.voice_memos;
create policy "voice_memos owner access" on public.voice_memos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reminders owner access" on public.reminders;
create policy "reminders owner access" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activity_events owner access" on public.activity_events;
create policy "activity_events owner access" on public.activity_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('voice-memos', 'voice-memos', false)
on conflict (id) do nothing;

drop policy if exists "voice memos upload" on storage.objects;
create policy "voice memos upload" on storage.objects
  for insert with check (
    bucket_id = 'voice-memos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice memos read" on storage.objects;
create policy "voice memos read" on storage.objects
  for select using (
    bucket_id = 'voice-memos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "voice memos delete" on storage.objects;
create policy "voice memos delete" on storage.objects
  for delete using (
    bucket_id = 'voice-memos' and auth.uid()::text = (storage.foldername(name))[1]
  );

do $$
begin
  alter publication supabase_realtime add table public.days;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.schedule_blocks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reminders;
exception when duplicate_object then null;
end $$;
