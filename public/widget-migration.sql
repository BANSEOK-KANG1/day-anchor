-- Day Anchor: 위젯 전용 마이그레이션 (idempotent)
-- 이미 days / schedule_blocks 등이 있는 DB에 "위젯만" 추가할 때 이 파일만 실행하세요.
-- Supabase Dashboard → SQL Editor → New query → 전체 붙여넣기 → Run

create extension if not exists "pgcrypto";

create table if not exists public.widget_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'widget',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists idx_widget_tokens_user on public.widget_tokens(user_id);

alter table public.widget_tokens enable row level security;

drop policy if exists "widget_tokens owner access" on public.widget_tokens;
create policy "widget_tokens owner access" on public.widget_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_widget_snapshot(p_token text, p_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_hash text;
  v_day_id uuid;
  v_target date;
  v_blocks jsonb;
  v_tasks jsonb;
  v_block_count int;
  v_done_blocks int;
  v_task_count int;
  v_done_tasks int;
  v_completion int;
  v_current jsonb;
  v_now_minutes int;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    return null;
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');
  select user_id into v_user_id from widget_tokens where token_hash = v_hash;
  if v_user_id is null then
    return null;
  end if;

  update widget_tokens set last_used_at = now() where token_hash = v_hash;

  v_target := coalesce(p_date, (timezone('Asia/Seoul', now()))::date);

  select id into v_day_id from days where user_id = v_user_id and date = v_target;
  if v_day_id is null then
    insert into days (user_id, date, main_goal, avoid_text, focus_window, review_completed)
    values (v_user_id, v_target, '', '', '', false)
    returning id into v_day_id;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'start', to_char(b.start_time, 'HH24:MI'),
      'end', to_char(b.end_time, 'HH24:MI'),
      'status', b.status
    ) order by b.start_time
  ), '[]'::jsonb)
  into v_blocks
  from schedule_blocks b
  where b.day_id = v_day_id;

  select count(*)::int, count(*) filter (where status = 'done')::int
  into v_block_count, v_done_blocks
  from schedule_blocks where day_id = v_day_id;

  select coalesce(jsonb_agg(
    jsonb_build_object('id', t.id, 'title', t.title, 'status', t.status)
    order by t.priority, t.due_time nulls last
  ), '[]'::jsonb)
  into v_tasks
  from tasks t
  where t.day_id = v_day_id and t.status = 'todo';

  select count(*)::int, count(*) filter (where status = 'done')::int
  into v_task_count, v_done_tasks
  from tasks where day_id = v_day_id;

  if v_task_count > 0 and v_block_count > 0 then
    v_completion := round(
      (v_done_tasks::numeric / v_task_count * 65) +
      (v_done_blocks::numeric / v_block_count * 35)
    );
  else
    v_completion := greatest(
      case when v_task_count > 0 then round(v_done_tasks::numeric / v_task_count * 100) else 0 end,
      case when v_block_count > 0 then round(v_done_blocks::numeric / v_block_count * 100) else 0 end
    );
  end if;

  if v_target = (timezone('Asia/Seoul', now()))::date then
    v_now_minutes := extract(hour from timezone('Asia/Seoul', now()))::int * 60
      + extract(minute from timezone('Asia/Seoul', now()))::int;

    select jsonb_build_object(
      'title', b.title,
      'start', to_char(b.start_time, 'HH24:MI'),
      'end', to_char(b.end_time, 'HH24:MI')
    )
    into v_current
    from schedule_blocks b
    where b.day_id = v_day_id
      and (extract(hour from b.start_time)::int * 60 + extract(minute from b.start_time)::int) <= v_now_minutes
      and (extract(hour from b.end_time)::int * 60 + extract(minute from b.end_time)::int) > v_now_minutes
    limit 1;
  end if;

  return jsonb_build_object(
    'date', v_target,
    'completion', v_completion,
    'blocks', v_blocks,
    'tasks', v_tasks,
    'current', v_current
  );
end;
$$;

revoke all on function public.get_widget_snapshot(text, date) from public;
grant execute on function public.get_widget_snapshot(text, date) to anon, authenticated;
