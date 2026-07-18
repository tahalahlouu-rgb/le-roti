-- ============================================================
-- Madrasati — RLS / RBAC v1
--   admin   : accès total limité à SON école
--   teacher : lecture de ses classes ; écriture notes + absences
--             uniquement sur ses affectations (classe, matière)
--   parent  : lecture seule sur SES enfants ; messagerie avec la direction
-- ============================================================

-- ------------------------------------------------------------
-- Fonctions utilitaires (security definer : évitent la récursion RLS)
-- ------------------------------------------------------------
create or replace function public.current_school_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select school_id from profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns user_role
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- L'enseignant intervient-il dans cette classe (peu importe la matière) ?
create or replace function public.teacher_in_class(p_class_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from teacher_assignments
    where teacher_id = auth.uid() and class_id = p_class_id
  );
$$;

-- L'enseignant est-il affecté à ce couple (classe, matière) ?
create or replace function public.teacher_teaches(p_class_id uuid, p_subject_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from teacher_assignments
    where teacher_id = auth.uid()
      and class_id = p_class_id
      and subject_id = p_subject_id
  );
$$;

-- L'utilisateur courant est-il le parent de cet élève ?
create or replace function public.is_parent_of(p_student_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from students
    where id = p_student_id and parent_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- Activation du RLS sur toutes les tables
-- ------------------------------------------------------------
alter table schools enable row level security;
alter table profiles enable row level security;
alter table levels enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table teacher_assignments enable row level security;
alter table students enable row level security;
alter table terms enable row level security;
alter table grades enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;
alter table announcements enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- ------------------------------------------------------------
-- schools : lecture par les membres, gestion par l'admin
-- ------------------------------------------------------------
create policy schools_select on schools
  for select using (id = current_school_id());

create policy schools_update on schools
  for update using (is_admin() and id = current_school_id());

-- ------------------------------------------------------------
-- profiles : chacun voit son profil ; l'admin voit et gère toute
-- son école ; parents/enseignants voient les profils de la
-- direction (nécessaire pour la messagerie)
-- ------------------------------------------------------------
create policy profiles_select_own on profiles
  for select using (id = auth.uid());

create policy profiles_select_admin on profiles
  for select using (is_admin() and school_id = current_school_id());

create policy profiles_select_direction on profiles
  for select using (role = 'admin' and school_id = current_school_id());

create policy profiles_insert_admin on profiles
  for insert with check (is_admin() and school_id = current_school_id());

create policy profiles_update_admin on profiles
  for update using (is_admin() and school_id = current_school_id());

create policy profiles_delete_admin on profiles
  for delete using (is_admin() and school_id = current_school_id());

-- ------------------------------------------------------------
-- Référentiels (levels, classes, subjects, terms) :
-- lecture par tous les membres de l'école, gestion par l'admin
-- ------------------------------------------------------------
create policy levels_select on levels
  for select using (school_id = current_school_id());
create policy levels_write on levels
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy classes_select on classes
  for select using (school_id = current_school_id());
create policy classes_write on classes
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy subjects_select on subjects
  for select using (school_id = current_school_id());
create policy subjects_write on subjects
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy terms_select on terms
  for select using (school_id = current_school_id());
create policy terms_write on terms
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

-- ------------------------------------------------------------
-- teacher_assignments : l'enseignant voit les siennes,
-- l'admin voit et gère celles de son école
-- ------------------------------------------------------------
create policy assignments_select_own on teacher_assignments
  for select using (teacher_id = auth.uid());

create policy assignments_select_admin on teacher_assignments
  for select using (is_admin() and school_id = current_school_id());

create policy assignments_write_admin on teacher_assignments
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

-- ------------------------------------------------------------
-- students : admin = CRUD école ; enseignant = lecture de ses
-- classes ; parent = lecture de ses enfants
-- ------------------------------------------------------------
create policy students_admin on students
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy students_select_teacher on students
  for select using (teacher_in_class(class_id));

create policy students_select_parent on students
  for select using (parent_id = auth.uid());

-- ------------------------------------------------------------
-- grades : admin = tout ; enseignant = CRUD sur ses affectations
-- (classe, matière) ; parent = lecture des notes de ses enfants
-- ------------------------------------------------------------
create policy grades_admin on grades
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy grades_select_teacher on grades
  for select using (teacher_in_class(class_id));

create policy grades_insert_teacher on grades
  for insert with check (
    teacher_teaches(class_id, subject_id)
    and teacher_id = auth.uid()
    and school_id = current_school_id()
  );

create policy grades_update_teacher on grades
  for update using (teacher_teaches(class_id, subject_id))
  with check (teacher_teaches(class_id, subject_id));

create policy grades_delete_teacher on grades
  for delete using (teacher_teaches(class_id, subject_id));

-- ------------------------------------------------------------
-- attendance : admin = tout ; enseignant = CRUD sur ses classes ;
-- parent = lecture pour ses enfants
-- ------------------------------------------------------------
create policy attendance_admin on attendance
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy attendance_teacher on attendance
  for all using (teacher_in_class(class_id))
  with check (teacher_in_class(class_id) and school_id = current_school_id());

create policy attendance_select_parent on attendance
  for select using (is_parent_of(student_id));

-- ------------------------------------------------------------
-- payments : admin = tout ; parent = lecture pour ses enfants ;
-- l'enseignant n'a AUCUN accès aux paiements
-- ------------------------------------------------------------
create policy payments_admin on payments
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

create policy payments_select_parent on payments
  for select using (is_parent_of(student_id));

-- ------------------------------------------------------------
-- announcements : lecture par tous les membres de l'école,
-- gestion par l'admin
-- ------------------------------------------------------------
create policy announcements_select on announcements
  for select using (school_id = current_school_id());

create policy announcements_write_admin on announcements
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

-- ------------------------------------------------------------
-- conversations : le parent voit et crée les siennes ;
-- l'admin voit celles de son école
-- ------------------------------------------------------------
create policy conversations_parent_select on conversations
  for select using (parent_id = auth.uid());

create policy conversations_parent_insert on conversations
  for insert with check (
    parent_id = auth.uid()
    and current_user_role() = 'parent'
    and school_id = current_school_id()
  );

create policy conversations_admin on conversations
  for all using (is_admin() and school_id = current_school_id())
  with check (is_admin() and school_id = current_school_id());

-- ------------------------------------------------------------
-- messages : visibles par les participants du fil ; chaque
-- participant écrit en son nom dans ses fils
-- ------------------------------------------------------------
create policy messages_select on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.parent_id = auth.uid()
             or (is_admin() and c.school_id = current_school_id()))
    )
  );

create policy messages_insert on messages
  for insert with check (
    sender_id = auth.uid()
    and school_id = current_school_id()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.parent_id = auth.uid()
             or (is_admin() and c.school_id = current_school_id()))
    )
  );

-- Marquer un message comme lu (read_at) par un participant du fil
create policy messages_update_read on messages
  for update using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.parent_id = auth.uid()
             or (is_admin() and c.school_id = current_school_id()))
    )
  );
