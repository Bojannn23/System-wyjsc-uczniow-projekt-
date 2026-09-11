-- Uruchom tę migrację w Supabase SQL Editor lub przez Supabase CLI.
-- Hasła i tokeny są przechowywane wyłącznie w auth.users przez Supabase Auth.

create type public.app_role as enum ('nauczyciel', 'dyrektor', 'pedagog');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete restrict,
  first_name text not null default '',
  last_name text not null default '',
  role public.app_role not null default 'nauczyciel',
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  school_year text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name, school_year)
);

create table public.class_staff (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (class_id, user_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_exits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  returned_at timestamptz,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint returned_after_started check (returned_at is null or returned_at >= started_at)
);

create index students_class_id_idx on public.students(class_id);
create index student_exits_student_id_idx on public.student_exits(student_id);
create index student_exits_active_idx on public.student_exits(student_id) where returned_at is null;
create index class_staff_user_id_idx on public.class_staff(user_id);

-- Profil powstaje przy rejestracji. Administrator przypisuje później szkołę i rolę.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Funkcje używane przez polityki RLS. security definer chroni przed rekurencją polityk.
create function public.current_school_id()
returns uuid language sql stable security definer set search_path = public
as $$ select school_id from public.profiles where id = auth.uid() $$;

create function public.is_director()
returns boolean language sql stable security definer set search_path = public
as $$ select role = 'dyrektor' from public.profiles where id = auth.uid() $$;

create function public.can_access_class(target_class_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_director()
  or exists (
    select 1 from public.class_staff
    where class_id = target_class_id and user_id = auth.uid()
  )
$$;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_staff enable row level security;
alter table public.students enable row level security;
alter table public.student_exits enable row level security;

create policy "Users see their school" on public.schools for select to authenticated
  using (id = public.current_school_id());
create policy "Users see own profile, directors see school profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or (public.is_director() and school_id = public.current_school_id()));
create policy "Users see authorized classes" on public.classes for select to authenticated
  using (school_id = public.current_school_id() and public.can_access_class(id));
create policy "Users see relevant class assignments" on public.class_staff for select to authenticated
  using (user_id = auth.uid() or public.is_director() or public.can_access_class(class_id));
create policy "Users see students in authorized classes" on public.students for select to authenticated
  using (public.can_access_class(class_id));
create policy "Users see exits in authorized classes" on public.student_exits for select to authenticated
  using (exists (select 1 from public.students s where s.id = student_id and public.can_access_class(s.class_id)));
create policy "Staff register exits for authorized students" on public.student_exits for insert to authenticated
  with check (
    recorded_by = auth.uid()
    and exists (select 1 from public.students s where s.id = student_id and public.can_access_class(s.class_id))
  );
create policy "Staff update own exits, director updates school exits" on public.student_exits for update to authenticated
  using (recorded_by = auth.uid() or public.is_director())
  with check (recorded_by = auth.uid() or public.is_director());
