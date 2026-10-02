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
    or exists (
      select 1 from public.class_teacher_assignments cta
      where cta.teacher_id = private.current_staff_id()
        and cta.class_id = p_class_id
        and cta.role_type in ('homeroom', 'subject_teacher')
    )
$$;

create or replace function private.can_access_student(p_student_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and private.can_access_class(s.class_id)
  )
$$;
