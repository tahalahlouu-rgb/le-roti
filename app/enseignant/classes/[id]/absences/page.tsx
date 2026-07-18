import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { todayISO } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { saveAttendance } from "@/lib/actions/attendance";
import type { Attendance } from "@/lib/types";

const STATUSES = [
  { value: "present", labelKey: "present", color: "text-emerald-700" },
  { value: "absence", labelKey: "absence", color: "text-red-700" },
  { value: "late", labelKey: "late", color: "text-amber-700" },
] as const;

// Appel rapide : une ligne par élève, trois états (présent par défaut)
export default async function TeacherAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id: classId } = await params;
  const { date: dateParam } = await searchParams;
  const profile = await requireRole("teacher");
  const supabase = await createClient();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? dateParam!
    : todayISO();

  const [{ data: klass }, { data: assignment }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("id", classId).single(),
    supabase
      .from("teacher_assignments")
      .select("id")
      .eq("class_id", classId)
      .eq("teacher_id", profile.id)
      .limit(1)
      .maybeSingle(),
  ]);
  if (!klass || !assignment) notFound();

  const [{ data: studentsData }, { data: existingData }] = await Promise.all([
    supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("last_name")
      .order("first_name"),
    supabase
      .from("attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("date", date),
  ]);
  const students = studentsData ?? [];
  const existing = (existingData ?? []) as Attendance[];
  const statusOf = (studentId: string) =>
    existing.find((r) => r.student_id === studentId)?.type ?? "present";

  return (
    <>
      <Link
        href="/enseignant"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader
        title={`${t.attendance.callTitle} — ${klass.name}`}
      />

      <form method="get" className="mb-4 flex gap-2">
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="input w-44"
        />
        <button type="submit" className="btn-secondary">
          {t.common.filter}
        </button>
      </form>

      <ActionForm action={saveAttendance} className="card max-w-2xl">
        <input type="hidden" name="class_id" value={classId} />
        <input type="hidden" name="date" value={date} />
        <div className="divide-y divide-slate-100">
          {students.map((s) => {
            const current = statusOf(s.id);
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-slate-800">
                  {s.last_name} {s.first_name}
                </span>
                <div className="flex gap-1">
                  {STATUSES.map((status) => (
                    <label
                      key={status.value}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors has-checked:border-current has-checked:bg-current/10 ${status.color} border-slate-200`}
                    >
                      <input
                        type="radio"
                        name={`status_${s.id}`}
                        value={status.value}
                        defaultChecked={current === status.value}
                        className="sr-only"
                      />
                      {t.attendance[status.labelKey]}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-100 p-4">
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
