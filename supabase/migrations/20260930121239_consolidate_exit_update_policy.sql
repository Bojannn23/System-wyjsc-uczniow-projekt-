create index student_exit_audit_changed_by_idx
  on public.student_exit_audit (changed_by);

drop policy student_exits_finish_own_active on public.student_exits;
drop policy student_exits_correct_by_school_managers on public.student_exits;

create policy student_exits_update_by_teacher_or_managers
  on public.student_exits
  for update to authenticated
  using (
    (
      teacher_id = (select private.current_staff_id())
      and status = 'active'
      and (select private.can_access_student(student_id))
    )
    or (select private.can_view_school_data())
  )
  with check (
    (
      teacher_id = (select private.current_staff_id())
      and status = 'completed'
      and ended_at is not null
      and ended_at >= started_at
      and lesson_session_id is not null
    )
    or (
      (select private.can_view_school_data())
      and (ended_at is null or ended_at >= started_at)
    )
  );
