-- Statistiques de classe pour le bulletin (moyennes de classe, rang).
-- Un parent ne peut pas lire les notes des autres élèves (RLS) ; cette
-- fonction security definer agrège les données côté base après avoir
-- vérifié que l'appelant a bien un lien avec la classe.
create or replace function public.class_term_stats(p_class_id uuid, p_term_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  authorized boolean;
  result jsonb;
begin
  select
    is_admin()
    or teacher_in_class(p_class_id)
    or exists (
      select 1 from students
      where class_id = p_class_id and parent_id = auth.uid()
    )
  into authorized;
  if not coalesce(authorized, false) then
    return null;
  end if;

  with per_student_subject as (
    select
      student_id,
      subject_id,
      sum(score * coefficient) / sum(coefficient) as avg_score
    from grades
    where class_id = p_class_id and term_id = p_term_id
    group by student_id, subject_id
  ),
  subj as (
    select subject_id, avg(avg_score) as class_avg
    from per_student_subject
    group by subject_id
  ),
  gen as (
    select student_id, avg(avg_score) as general_avg
    from per_student_subject
    group by student_id
  )
  select jsonb_build_object(
    'subjects',
    (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'subject_id', subject_id,
          'class_avg', round(class_avg, 2)
        )),
        '[]'::jsonb
      )
      from subj
    ),
    'students',
    (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'student_id', student_id,
          'general_avg', round(general_avg, 2)
        )),
        '[]'::jsonb
      )
      from gen
    )
  )
  into result;

  return result;
end;
$$;
