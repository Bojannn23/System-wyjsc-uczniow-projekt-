create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.current_staff_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select s.id
  from public.staff s
  where s.auth_user_id = (select auth.uid())
     or lower(s.email) = lower((select auth.jwt() ->> 'email'))
  order by (s.auth_user_id = (select auth.uid())) desc nulls last
  limit 1
$$;

create or replace function private.has_role(p_role text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff s
    join public.roles r on r.id = s.role_id
    where (s.auth_user_id = (select auth.uid())
       or lower(s.email) = lower((select auth.jwt() ->> 'email')))
      and r.name = p_role
  )
$$;

create or replace function private.can_view_school_data()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.has_role('dyrektor') or private.has_role('pedagog')
$$;

create or replace function private.can_access_class(p_class_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_view_school_data()
    or exists (
      select 1 from public.teacher_classes tc
      where tc.teacher_id = private.current_staff_id()
        and tc.class_id = p_class_id
    )
$$;

create or replace function private.can_access_student(p_student_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_view_school_data()
    or exists (
      select 1
      from public.students s
      join public.teacher_classes tc on tc.class_id = s.class_id
      where s.id = p_student_id
        and tc.teacher_id = private.current_staff_id()
    )
$$;

create or replace function private.can_access_lesson(p_lesson_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_view_school_data()
    or exists (
      select 1 from public.lessons l
      where l.id = p_lesson_id
        and (l.teacher_id = private.current_staff_id()
          or private.can_access_class(l.class_id))
    )
$$;

create or replace function private.can_access_subject(p_subject_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_view_school_data()
    or exists (
      select 1 from public.lessons l
      where l.subject_id = p_subject_id
        and (l.teacher_id = private.current_staff_id()
          or private.can_access_class(l.class_id))
    )
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on all functions in schema private to authenticated;

create or replace function public.set_student_exit_teacher()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  new.teacher_id := private.current_staff_id();
  return new;
end;
$$;
revoke all on function public.set_student_exit_teacher() from public, anon, authenticated;

create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.school_classes(id),
  teacher_id uuid not null references public.staff(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lesson_sessions_time_order check (ended_at is null or ended_at >= started_at)
);
create unique index lesson_sessions_one_active_per_class
  on public.lesson_sessions(class_id) where ended_at is null;
alter table public.student_exits
  add column lesson_session_id uuid references public.lesson_sessions(id),
  add constraint student_exits_time_order check (ended_at is null or ended_at >= started_at);
create unique index student_exits_one_active_per_student
  on public.student_exits(student_id) where status = 'active';

create or replace function public.prevent_closing_lesson_with_active_exits()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.ended_at is null and new.ended_at is not null
     and exists (
       select 1 from public.student_exits e
       where e.lesson_session_id = old.id and e.status = 'active'
     ) then
    raise exception using
      errcode = '23514',
      message = 'Nie można zakończyć lekcji, gdy uczeń ma aktywne wyjście.';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_closing_lesson_with_active_exits() from public, anon, authenticated;
create trigger lesson_sessions_require_returned_students
before update of ended_at on public.lesson_sessions
for each row execute function public.prevent_closing_lesson_with_active_exits();

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('roles','staff','school_classes','students','subjects','lessons',
                        'attendance','student_exits','class_teacher_assignments','teacher_classes')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.roles enable row level security;
alter table public.staff enable row level security;
alter table public.school_classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.attendance enable row level security;
alter table public.student_exits enable row level security;
alter table public.class_teacher_assignments enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.lesson_sessions enable row level security;

create policy roles_read_authenticated on public.roles
for select to authenticated using (true);

create policy staff_read_self_or_school_managers on public.staff
for select to authenticated
using (id = (select private.current_staff_id()) or (select private.can_view_school_data()));

create policy school_classes_read_assigned on public.school_classes
for select to authenticated
using ((select private.can_access_class(id)));

create policy students_read_assigned on public.students
for select to authenticated
using ((select private.can_access_class(class_id)));

create policy subjects_read_assigned on public.subjects
for select to authenticated
using ((select private.can_access_subject(id)));

create policy lessons_read_assigned on public.lessons
for select to authenticated
using (
  teacher_id = (select private.current_staff_id())
  or (select private.can_access_class(class_id))
);

create policy attendance_read_assigned on public.attendance
for select to authenticated
using ((select private.can_access_lesson(lesson_id)));

create policy assignments_read_own_or_school_managers on public.class_teacher_assignments
for select to authenticated
using (teacher_id = (select private.current_staff_id()) or (select private.can_view_school_data()));

create policy teacher_classes_read_own_or_school_managers on public.teacher_classes
for select to authenticated
using (teacher_id = (select private.current_staff_id()) or (select private.can_view_school_data()));

create policy student_exits_read_assigned on public.student_exits
for select to authenticated
using ((select private.can_access_student(student_id)));

create policy student_exits_insert_during_active_lesson on public.student_exits
for insert to authenticated
with check (
  (select private.has_role('nauczyciel'))
  and teacher_id = (select private.current_staff_id())
  and status = 'active'
  and ended_at is null
  and lesson_session_id is not null
  and (select private.can_access_student(student_id))
  and exists (
    select 1 from public.lesson_sessions ls
    join public.students s on s.id = student_exits.student_id
    where ls.id = student_exits.lesson_session_id
      and ls.class_id = s.class_id
      and ls.teacher_id = (select private.current_staff_id())
      and ls.ended_at is null
  )
);

create policy student_exits_finish_own_active on public.student_exits
for update to authenticated
using (
  teacher_id = (select private.current_staff_id())
  and status = 'active'
  and (select private.can_access_student(student_id))
)
with check (
  teacher_id = (select private.current_staff_id())
  and status = 'completed'
  and ended_at is not null
  and ended_at >= started_at
  and lesson_session_id is not null
);

create policy lesson_sessions_read_assigned on public.lesson_sessions
for select to authenticated
using (
  teacher_id = (select private.current_staff_id())
  or (select private.can_access_class(class_id))
);

create policy lesson_sessions_start_assigned on public.lesson_sessions
for insert to authenticated
with check (
  teacher_id = (select private.current_staff_id())
  and (select private.has_role('nauczyciel'))
  and (select private.can_access_class(class_id))
  and ended_at is null
);

create policy lesson_sessions_finish_own on public.lesson_sessions
for update to authenticated
using (
  teacher_id = (select private.current_staff_id())
  and ended_at is null
  and (select private.can_access_class(class_id))
)
with check (
  teacher_id = (select private.current_staff_id())
  and ended_at is not null
  and (select private.can_access_class(class_id))
);

grant select, insert, update on public.lesson_sessions to authenticated;
revoke all on public.lesson_sessions from anon;
