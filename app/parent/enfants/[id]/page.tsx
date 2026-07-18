import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDate, formatScore } from "@/lib/format";
import {
  subjectAverages,
  generalAverage,
  pickCurrentTerm,
} from "@/lib/grades";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";
import type { Attendance, Grade, Term } from "@/lib/types";

interface ChildRow {
  id: string;
  first_name: string;
  last_name: string;
  class: { name: string } | null;
}

// Fiche enfant côté parent : notes du trimestre + bulletin.
// (Les sections absences et paiements arrivent avec les modules 3 et 4.)
export default async function ChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const { id } = await params;
  const { trimestre } = await searchParams;
  const supabase = await createClient();

  const [{ data }, { data: termsData }, { data: subjectsData }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, class:classes(name)")
        .eq("id", id)
        .single(),
      supabase.from("terms").select("*").order("start_date"),
      supabase.from("subjects").select("id, name"),
    ]);
  if (!data) notFound();
  const child = data as unknown as ChildRow;

  const terms = (termsData ?? []) as Term[];
  const term = terms.find((tm) => tm.id === trimestre) ?? pickCurrentTerm(terms);
  const subjectName = new Map(
    (subjectsData ?? []).map((s) => [s.id, s.name] as const)
  );

  const currentMonthStart = new Date().toISOString().slice(0, 7) + "-01";
  const [{ data: gradesData }, { data: attendanceData }] = await Promise.all([
    term
      ? supabase
          .from("grades")
          .select("*")
          .eq("student_id", id)
          .eq("term_id", term.id)
          .order("graded_on")
      : Promise.resolve({ data: [] }),
    supabase
      .from("attendance")
      .select("*")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(60),
  ]);
  const grades = (gradesData ?? []) as Grade[];
  const attendance = (attendanceData ?? []) as Attendance[];
  const monthAbsences = attendance.filter(
    (a) => a.type === "absence" && a.date >= currentMonthStart
  ).length;
  const monthLates = attendance.filter(
    (a) => a.type === "late" && a.date >= currentMonthStart
  ).length;

  const averages = subjectAverages(grades);
  const general = generalAverage(averages.values());
  const subjects = [...averages.entries()]
    .map(([subjectId, avg]) => ({
      id: subjectId,
      name: subjectName.get(subjectId) ?? "—",
      avg,
      grades: grades.filter((g) => g.subject_id === subjectId),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Link
        href="/parent"
        className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-700">
          {child.first_name[0]}
          {child.last_name[0]}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {child.first_name} {child.last_name}
          </h1>
          <p className="text-sm text-slate-500">
            {child.class?.name ?? t.students.noClass}
          </p>
        </div>
      </div>

      {/* Trimestre */}
      {terms.length > 0 && (
        <form method="get" className="mb-4 flex gap-2">
          <select
            name="trimestre"
            defaultValue={term?.id ?? ""}
            className="input flex-1"
          >
            {terms.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            OK
          </button>
        </form>
      )}

      {/* Notes */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Icon name="book" className="h-4 w-4 text-slate-400" />
            {t.grades.title}
          </h2>
          {term && (
            <Link
              href={`/bulletin/${child.id}?trimestre=${term.id}`}
              className="text-sm font-medium text-emerald-700"
            >
              {t.grades.bulletin} →
            </Link>
          )}
        </div>

        {subjects.length === 0 ? (
          <div className="card p-4 text-sm text-slate-500">
            {t.grades.noGrades}
          </div>
        ) : (
          <>
            {general != null && (
              <div className="card mb-3 flex items-center justify-between bg-emerald-700 p-4 text-white">
                <span className="text-sm font-medium">
                  {t.grades.generalAverage}
                </span>
                <span className="text-xl font-bold">
                  {formatScore(general)}
                  <span className="text-sm font-normal opacity-80"> / 20</span>
                </span>
              </div>
            )}
            <div className="card divide-y divide-slate-100">
              {subjects.map((subject) => (
                <details key={subject.id} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">
                      {subject.name}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {formatScore(subject.avg)}
                    </span>
                  </summary>
                  <ul className="space-y-1 bg-slate-50 px-4 py-2">
                    {subject.grades.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">
                          {g.title}
                          <span className="ml-2 text-xs text-slate-400">
                            {formatDate(g.graded_on)} · coef{" "}
                            {Number(g.coefficient)}
                          </span>
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatScore(Number(g.score))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Absences & retards */}
      <section className="mb-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Icon name="calendarX" className="h-4 w-4 text-slate-400" />
          {t.attendance.title}
        </h2>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">
              {t.attendance.absences} · {t.attendance.thisMonth}
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                monthAbsences > 0 ? "text-red-700" : "text-slate-900"
              }`}
            >
              {monthAbsences}
            </p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">
              {t.attendance.lates} · {t.attendance.thisMonth}
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                monthLates > 0 ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {monthLates}
            </p>
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="card p-4 text-sm text-slate-500">
            {t.attendance.noneThisMonth}
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t.attendance.history}
            </p>
            {attendance.slice(0, 15).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-slate-700">{formatDate(a.date)}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={a.type === "absence" ? "red" : "amber"}>
                    {a.type === "absence"
                      ? t.attendance.absence
                      : t.attendance.late}
                  </Badge>
                  {a.justified && (
                    <Badge tone="green">{t.attendance.justified}</Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
