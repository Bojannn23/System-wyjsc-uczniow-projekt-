create policy school_classes_manage_director
  on public.school_classes for all to authenticated
  using ((select private.has_role('dyrektor')))
  with check ((select private.has_role('dyrektor')));

create policy students_manage_director
  on public.students for all to authenticated
  using ((select private.has_role('dyrektor')))
  with check ((select private.has_role('dyrektor')));

create policy staff_manage_director
  on public.staff for all to authenticated
  using ((select private.has_role('dyrektor')))
  with check ((select private.has_role('dyrektor')));

create policy class_teacher_assignments_manage_director
  on public.class_teacher_assignments for all to authenticated
  using ((select private.has_role('dyrektor')))
  with check ((select private.has_role('dyrektor')));

create policy teacher_classes_manage_director
  on public.teacher_classes for all to authenticated
  using ((select private.has_role('dyrektor')))
  with check ((select private.has_role('dyrektor')));

grant insert, update, delete on public.school_classes, public.students, public.staff,
  public.class_teacher_assignments, public.teacher_classes to authenticated;
