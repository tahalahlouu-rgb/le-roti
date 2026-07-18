import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import { formatDate, formatScore } from "@/lib/format";
import {
  subjectAverages,
  generalAverage,
  pickCurrentTerm,
  type ClassTermStats,
} from "@/lib/grades";
import { PrintToolbar } from "@/components/print-toolbar";
import type { Grade, Term } from "@/lib/types";

// Bulletin trimestriel imprimable. L'accès aux données est garanti
// par le RLS : un parent n'obtient que ses enfants, un admin toute
// son école. Les moyennes de classe viennent de class_term_stats.
export default async function BulletinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const { id } = await params;
  const { trimestre } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) redirect("/connexion");
  const supabase = await createClient();

  const [{ data: studentData }, { data: termsData }, { data: subjectsData }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, class:classes(id, name)")
        .eq("id", id)
        .single(),
      supabase.from("terms").select("*").order("start_date"),
      supabase.from("subjects").select("id, name"),
    ]);
  if (!studentData) notFound();
  const student = studentData as unknown as {
    id: string;
    first_name: string;
    last_name: string;
    class: { id: string; name: string } | null;
  };

  const terms = (termsData ?? []) as Term[];
  const term = terms.find((tm) => tm.id === trimestre) ?? pickCurrentTerm(terms);
  if (!term || !student.class) notFound();

  const subjectName = new Map(
    (subjectsData ?? []).map((s) => [s.id, s.name] as const)
  );

  const [{ data: gradesData }, { data: statsData }] = await Promise.all([
    supabase
      .from("grades")
      .select("*")
      .eq("student_id", id)
      .eq("term_id", term.id),
    supabase.rpc("class_term_stats", {
      p_class_id: student.class.id,
      p_term_id: term.id,
    }),
  ]);
  const grades = (gradesData ?? []) as Grade[];
  const stats = (statsData ?? { subjects: [], students: [] }) as ClassTermStats;

  const studentAvgs = subjectAverages(grades);
  const studentGeneral = generalAverage(studentAvgs.values());
  const classAvgBySubject = new Map(
    stats.subjects.map((s) => [s.subject_id, s.class_avg] as const)
  );
  const classGeneral = generalAverage(
    stats.students.map((s) => s.general_avg)
  );
  const rank =
    studentGeneral == null
      ? null
      : stats.students.filter((s) => s.general_avg > studentGeneral + 1e-9)
          .length + 1;

  const rows = [...studentAvgs.entries()]
    .map(([subjectId, avg]) => ({
      name: subjectName.get(subjectId) ?? "—",
      studentAvg: avg,
      classAvg: classAvgBySubject.get(subjectId) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const school = profile.school;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <PrintToolbar />

      {/* Choix du trimestre (écran uniquement) */}
      <form method="get" className="no-print mb-6 flex gap-2">
        <select name="trimestre" defaultValue={term.id} className="input w-44">
          {terms.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          {t.common.filter}
        </button>
      </form>

      <div className="card print-sheet p-8">
        {/* En-tête */}
        <header className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <p className="text-lg font-bold text-slate-900">{school.name}</p>
            {school.address && (
              <p className="text-sm text-slate-600">{school.address}</p>
            )}
            {school.phone && (
              <p className="text-sm text-slate-600">{school.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase text-slate-900">
              {t.bulletin.title}
            </p>
            <p className="text-sm text-slate-600">{term.name}</p>
            <p className="text-sm text-slate-600">
              {t.bulletin.schoolYear} {term.academic_year}
            </p>
          </div>
        </header>

        {/* Élève */}
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          <p>
            <span className="text-slate-500">{t.bulletin.student} :</span>{" "}
            <span className="font-semibold text-slate-900">
              {student.first_name} {student.last_name}
            </span>
          </p>
          <p>
            <span className="text-slate-500">{t.bulletin.class} :</span>{" "}
            <span className="font-semibold text-slate-900">
              {student.class.name}
            </span>
          </p>
          <p className="text-slate-500">
            {t.bulletin.issuedOn} {formatDate(new Date())}
          </p>
        </div>

        {/* Notes */}
        {rows.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">
            {t.grades.noGrades}
          </p>
        ) : (
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="py-2 pr-2 font-semibold text-slate-900">
                  {t.bulletin.subject}
                </th>
                <th className="w-40 py-2 text-center font-semibold text-slate-900">
                  {t.bulletin.classAverage}
                </th>
                <th className="w-40 py-2 text-center font-semibold text-slate-900">
                  {t.bulletin.studentAverage}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-slate-200">
                  <td className="py-2 pr-2 text-slate-700">{row.name}</td>
                  <td className="py-2 text-center text-slate-600">
                    {row.classAvg != null ? formatScore(row.classAvg) : "—"}
                  </td>
                  <td className="py-2 text-center font-semibold text-slate-900">
                    {formatScore(row.studentAvg)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900">
                <td className="py-3 font-bold text-slate-900">
                  {t.bulletin.generalAverage}
                </td>
                <td className="py-3 text-center text-slate-600">
                  {classGeneral != null ? formatScore(classGeneral) : "—"}
                </td>
                <td className="py-3 text-center text-lg font-bold text-slate-900">
                  {studentGeneral != null ? formatScore(studentGeneral) : "—"}
                  <span className="text-sm font-normal text-slate-500">
                    {" "}
                    / 20
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Rang + signature */}
        <div className="mt-8 flex items-end justify-between">
          <p className="text-sm text-slate-700">
            {rank != null && (
              <>
                {t.bulletin.rank} :{" "}
                <span className="font-semibold text-slate-900">
                  {rank} {t.bulletin.of} {stats.students.length}
                </span>
              </>
            )}
          </p>
          <div className="text-center">
            <p className="mb-14 text-sm font-medium text-slate-700">
              {t.bulletin.signature}
            </p>
            <div className="w-40 border-t border-slate-400"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
