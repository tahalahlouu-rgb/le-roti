-- ============================================================
-- Madrasati — Schéma v1
-- SaaS de gestion scolaire pour écoles privées marocaines
-- Toutes les tables portent un school_id (multi-écoles prêt).
-- Valeurs d'enums en anglais technique ; libellés français côté i18n.
-- ============================================================

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type user_role as enum ('admin', 'teacher', 'parent');
create type attendance_type as enum ('absence', 'late');
create type payment_status as enum ('unpaid', 'paid');
create type payment_method as enum ('cash', 'cheque', 'transfer');

-- ------------------------------------------------------------
-- Écoles
-- ------------------------------------------------------------
create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text,
  phone         text,
  email         text,
  academic_year text not null default '2025-2026',
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Profils utilisateurs (1-1 avec auth.users de Supabase)
-- ------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  school_id  uuid not null references schools (id) on delete cascade,
  role       user_role not null,
  first_name text not null,
  last_name  text not null,
  phone      text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Niveaux (CP, CE1, …) — porte la mensualité par défaut du niveau
-- ------------------------------------------------------------
create table levels (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references schools (id) on delete cascade,
  name                text not null,
  display_order       int  not null default 0,
  default_monthly_fee numeric(10, 2), -- MAD
  unique (school_id, name)
);

-- ------------------------------------------------------------
-- Classes (CE1-A, …)
-- ------------------------------------------------------------
create table classes (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools (id) on delete cascade,
  level_id      uuid not null references levels (id) on delete restrict,
  name          text not null,
  academic_year text not null,
  unique (school_id, name, academic_year)
);

-- ------------------------------------------------------------
-- Matières
-- ------------------------------------------------------------
create table subjects (
  id        uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name      text not null,
  unique (school_id, name)
);

-- ------------------------------------------------------------
-- Affectations enseignant → (classe, matière)
-- Fonde le RBAC enseignant : il ne voit que ses classes.
-- ------------------------------------------------------------
create table teacher_assignments (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  teacher_id uuid not null references profiles (id) on delete cascade,
  class_id   uuid not null references classes (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  unique (teacher_id, class_id, subject_id)
);

-- ------------------------------------------------------------
-- Élèves — parent_id relie l'élève au compte parent.
-- monthly_fee (optionnel) prime sur le tarif par défaut du niveau.
-- ------------------------------------------------------------
create table students (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  class_id    uuid references classes (id) on delete set null,
  parent_id   uuid references profiles (id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  gender      text check (gender in ('M', 'F')),
  birth_date  date,
  phone       text,
  monthly_fee numeric(10, 2), -- MAD, remplace le tarif du niveau si renseigné
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trimestres — les bulletins et moyennes sont calculés par trimestre
-- ------------------------------------------------------------
create table terms (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools (id) on delete cascade,
  name          text not null,
  academic_year text not null,
  start_date    date not null,
  end_date      date not null,
  unique (school_id, name, academic_year)
);

-- ------------------------------------------------------------
-- Notes — note sur 20 avec coefficient ; moyennes calculées à la volée
-- ------------------------------------------------------------
create table grades (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  class_id    uuid not null references classes (id) on delete cascade,
  subject_id  uuid not null references subjects (id) on delete cascade,
  teacher_id  uuid references profiles (id) on delete set null,
  term_id     uuid not null references terms (id) on delete cascade,
  title       text not null, -- ex. « Contrôle 1 »
  score       numeric(4, 2) not null check (score >= 0 and score <= 20),
  coefficient numeric(4, 2) not null default 1 check (coefficient > 0),
  graded_on   date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Absences & retards — un enregistrement par élève/jour/type
-- ------------------------------------------------------------
create table attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  class_id    uuid not null references classes (id) on delete cascade,
  date        date not null,
  type        attendance_type not null,
  justified   boolean not null default false,
  comment     text,
  recorded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (student_id, date, type)
);

-- ------------------------------------------------------------
-- Paiements — une ligne = une mensualité d'un élève.
-- Le règlement manuel passe la ligne à « paid » (méthode, date, reçu).
-- ------------------------------------------------------------
create table payments (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools (id) on delete cascade,
  student_id     uuid not null references students (id) on delete cascade,
  month          date not null, -- toujours le 1er du mois (ex. 2025-09-01)
  amount         numeric(10, 2) not null, -- MAD
  status         payment_status not null default 'unpaid',
  paid_at        timestamptz,
  method         payment_method,
  receipt_number text,
  recorded_by    uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (student_id, month),
  unique (school_id, receipt_number)
);

-- ------------------------------------------------------------
-- Annonces de la direction — visibles par tous les parents de l'école
-- ------------------------------------------------------------
create table announcements (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools (id) on delete cascade,
  author_id    uuid references profiles (id) on delete set null,
  title        text not null,
  body         text not null,
  pinned       boolean not null default false,
  published_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Messagerie parent ↔ direction (fils de discussion)
-- ------------------------------------------------------------
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools (id) on delete cascade,
  parent_id       uuid not null references profiles (id) on delete cascade,
  subject         text not null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid references profiles (id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

-- Maintient last_message_at pour trier les fils par activité
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
after insert on messages
for each row execute function public.touch_conversation();

-- ------------------------------------------------------------
-- Index
-- ------------------------------------------------------------
create index idx_profiles_school on profiles (school_id, role);
create index idx_students_class on students (school_id, class_id);
create index idx_students_parent on students (parent_id);
create index idx_assignments_teacher on teacher_assignments (teacher_id);
create index idx_assignments_class on teacher_assignments (class_id);
create index idx_grades_student_term on grades (student_id, term_id);
create index idx_grades_class on grades (class_id, subject_id, term_id);
create index idx_attendance_student on attendance (student_id, date);
create index idx_attendance_class_date on attendance (class_id, date);
create index idx_payments_month on payments (school_id, month, status);
create index idx_payments_student on payments (student_id);
create index idx_announcements_school on announcements (school_id, published_at desc);
create index idx_messages_conversation on messages (conversation_id, created_at);
create index idx_conversations_parent on conversations (parent_id);
create index idx_conversations_school on conversations (school_id, last_message_at desc);
