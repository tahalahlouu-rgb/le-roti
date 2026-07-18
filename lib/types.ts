// Types miroirs du schéma Postgres (supabase/migrations/0001_schema.sql)

export type UserRole = "admin" | "teacher" | "parent";
export type AttendanceType = "absence" | "late";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "cash" | "cheque" | "transfer";

export interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  academic_year: string;
}

export interface Profile {
  id: string;
  school_id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export interface Level {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
  default_monthly_fee: number | null;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  level_id: string;
  name: string;
  academic_year: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string | null;
  parent_id: string | null;
  first_name: string;
  last_name: string;
  gender: "M" | "F" | null;
  birth_date: string | null;
  phone: string | null;
  monthly_fee: number | null;
  is_active: boolean;
}

export interface Term {
  id: string;
  school_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
}

export interface Grade {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  term_id: string;
  title: string;
  score: number;
  coefficient: number;
  graded_on: string;
}

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  date: string;
  type: AttendanceType;
  justified: boolean;
  comment: string | null;
  recorded_by: string | null;
}

export interface Payment {
  id: string;
  school_id: string;
  student_id: string;
  month: string; // toujours le 1er du mois
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  method: PaymentMethod | null;
  receipt_number: string | null;
  recorded_by: string | null;
}

export interface Announcement {
  id: string;
  school_id: string;
  author_id: string | null;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string;
}

export interface Conversation {
  id: string;
  school_id: string;
  parent_id: string;
  subject: string;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  school_id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
}
