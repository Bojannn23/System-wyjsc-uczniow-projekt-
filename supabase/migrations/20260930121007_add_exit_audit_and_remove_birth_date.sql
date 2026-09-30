alter table public.students
  drop column birth_date;

create table public.student_exit_audit (
  id uuid primary key default gen_random_uuid(),
  student_exit_id uuid not null references public.student_exits(id) on delete restrict,
  changed_by uuid references public.staff(id) on delete set null,
  changed_by_name text not null,
  action text not null check (action in ('created', 'updated')),
  changed_at timestamptz not null default clock_timestamp(),
  old_values jsonb,
  new_values jsonb not null
);

create index student_exit_audit_exit_changed_at_idx
  on public.student_exit_audit (student_exit_id, changed_at desc);

alter table public.student_exit_audit enable row level security;
revoke all on table public.student_exit_audit from public, anon, authenticated;
grant select on table public.student_exit_audit to authenticated;

create policy student_exit_audit_read_school_managers
  on public.student_exit_audit
  for select to authenticated
  using ((select private.can_view_school_data()));

create or replace function private.log_student_exit_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.current_staff_id();
  actor_name text;
  old_data jsonb;
  new_data jsonb;
begin
  select s.full_name into actor_name
  from public.staff s
  where s.id = actor_id;

  new_data := jsonb_build_object(
    'reason', new.reason,
    'started_at', new.started_at,
    'ended_at', new.ended_at,
    'status', new.status
  );

  if tg_op = 'UPDATE' then
    old_data := jsonb_build_object(
      'reason', old.reason,
      'started_at', old.started_at,
      'ended_at', old.ended_at,
      'status', old.status
    );

    if old_data is not distinct from new_data then
      return null;
    end if;
  end if;

  insert into public.student_exit_audit (
    student_exit_id,
    changed_by,
    changed_by_name,
    action,
    old_values,
    new_values
  ) values (
    new.id,
    actor_id,
    coalesce(actor_name, 'System'),
    case when tg_op = 'INSERT' then 'created' else 'updated' end,
    old_data,
    new_data
  );

  return null;
end;
$$;

revoke all on function private.log_student_exit_audit() from public, anon, authenticated;

create trigger student_exits_write_audit
  after insert or update of reason, started_at, ended_at, status
  on public.student_exits
  for each row execute function private.log_student_exit_audit();

create policy student_exits_correct_by_school_managers
  on public.student_exits
  for update to authenticated
  using ((select private.can_view_school_data()))
  with check (
    (select private.can_view_school_data())
    and (ended_at is null or ended_at >= started_at)
  );

revoke update on table public.student_exits from public, anon, authenticated;
grant update (reason, started_at, ended_at, status)
  on table public.student_exits to authenticated;
