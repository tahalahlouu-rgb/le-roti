import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDate, formatScore, todayISO } from "@/lib/format";
import { subjectAverages, pickCurrentTerm } from "@/lib/grades";
import { PageHeader, EmptyState } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import { addGradesBatch, deleteGradeSet } from "@/lib/actions/grades";
import type { Grade, Term } from "@/lib/types";

// Saisie des notes par l'enseignant : une matière + un trimestre à la
// fois ; un formulaire « contrôle » note toute la classe d'un coup.
export default async function TeacherGradesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ matiere?: string; trimestre?: string }>;
}) {
  const { id: classId } = await params;
  const { matiere, trimestre } = await searchParams;
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  // Affectations de l'enseignant pour cette classe (RLS : les siennes)
  const [{ data: klass }, { data: assignmentsData }, { data: termsData }] =
    await Promise.all([
      supabase.from("classes").select("id, name").eq("id", classId).single(),
      supabase
        .from("teacher_assignments")
        .select("subject:subjects(id, name)")
        .eq("class_id", classId)
        .eq("teacher_id", profile.id),
      supabase.from("terms").select("*").order("start_date"),
    ]);
  if (!klass) notFound();

  const subjects = (assignmentsData ?? [])
    .map((a) => a.subject as unknown as { id: string; name: string })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (subjects.length === 0) notFound();

  const terms = (termsData ?? []) as Term[];
  const subject =
    subjects.find((s) => s.id === matiere) ?? subjects[0];
  const term =
    terms.find((tm) => tm.id === trimestre) ?? pickCurrentTerm(terms);

  const { data: studentsData } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("last_name")
    .order("first_name");
  const students = studentsData ?? [];

  const { data: gradesData } = term
    ? await supabase
        .from("grades")
        .select("*")
        .eq("class_id", classId)
        .eq("subject_id", subject.id)
        .eq("term_id", term.id)
        .order("graded_on")
    : { data: [] };
  const grades = (gradesData ?? []) as Grade[];

  // Pivot : colonnes = contrôles (titre), lignes = élèves
  const controls: { title: string; graded_on: string; coefficient: number }[] =
    [];
  const seen = new Set<string>();
  for (const g of grades) {
    if (!seen.has(g.title)) {
      seen.add(g.title);
      controls.push({
        title: g.title,
        graded_on: g.graded_on,
        coefficient: Number(g.coefficient),
      });
    }
  }
  const scoreByStudentTitle = new Map<string, number>();
  for (const g of grades) {
    scoreByStudentTitle.set(`${g.student_id}|${g.title}`, Number(g.score));
  }
  const averages = subjectAverages(grades);

  return (
    <>
      <Link
        href="/enseignant"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader
        title={`${t.grades.title} — ${klass.name}`}
        subtitle={`${subject.name}${term ? ` · ${term.name}` : ""}`}
      />

      {/* Sélection matière / trimestre */}
      <form method="get" className="mb-6 flex flex-wrap gap-2">
        <select name="matiere" defaultValue={subject.id} className="input w-48">
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="trimestre"
          defaultValue={term?.id ?? ""}
          className="input w-44"
        >
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

      {!term ? (
        <EmptyState message={t.grades.noTerm} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-5">
          {/* Saisie d'un contrôle */}
          <section className="card p-5 xl:col-span-2">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.grades.entryTitle}
            </h2>
            <ActionForm action={addGradesBatch}>
              <input type="hidden" name="class_id" value={classId} />
              <input type="hidden" name="subject_id" value={subject.id} />
              <input type="hidden" name="term_id" value={term.id} />
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t.grades.controlTitle} *
                  </label>
                  <input
                    name="title"
                    required
                    placeholder="Contrôle 1"
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t.common.date}
                  </label>
                  <input
                    name="graded_on"
                    type="date"
                    defaultValue={todayISO()}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {t.grades.coefficient}
                  </label>
                  <input
                    name="coefficient"
                    type="number"
                    step="0.5"
                    min="0.5"
                    defaultValue="1"
                    className="input"
                  />
                </div>
              </div>

              <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {s.last_name} {s.first_name}
                    </span>
                    <input
                      name={`score_${s.id}`}
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      placeholder="—"
                      className="input w-20 text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <SubmitButton>{t.common.save}</SubmitButton>
              </div>
            </ActionForm>
          </section>

          {/* Contrôles enregistrés + moyennes */}
          <section className="card overflow-x-auto xl:col-span-3">
            <h2 className="px-5 pt-5 text-base font-semibold text-slate-900">
              {t.grades.savedControls}
            </h2>
            {controls.length === 0 ? (
              <p className="px-5 pb-5 pt-3 text-sm text-slate-400">
                {t.grades.noGrades}
              </p>
            ) : (
              <table className="table-base mt-3">
                <thead>
                  <tr>
                    <th>{t.students.lastName}</th>
                    {controls.map((c) => (
                      <th key={c.title} className="text-center">
                        <div>{c.title}</div>
                        <div className="font-normal normal-case text-slate-400">
                          {formatDate(c.graded_on)} · coef {c.coefficient}
                        </div>
                        <ActionForm action={deleteGradeSet} className="mt-1">
                          <input type="hidden" name="class_id" value={classId} />
                          <input
                            type="hidden"
                            name="subject_id"
                            value={subject.id}
                          />
                          <input type="hidden" name="term_id" value={term.id} />
                          <input type="hidden" name="title" value={c.title} />
                          <ConfirmButton
                            className="text-[11px] font-normal normal-case text-red-500 hover:underline"
                            message={t.grades.deleteControl}
                          >
                            {t.common.delete}
                          </ConfirmButton>
                        </ActionForm>
                      </th>
                    ))}
                    <th className="text-center">{t.grades.average}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const perStudent = grades.filter(
                      (g) => g.student_id === s.id
                    );
                    const avg = subjectAverages(perStudent).get(subject.id);
                    return (
                      <tr key={s.id}>
                        <td className="font-medium text-slate-900">
                          {s.last_name} {s.first_name}
                        </td>
                        {controls.map((c) => {
                          const score = scoreByStudentTitle.get(
                            `${s.id}|${c.title}`
                          );
                          return (
                            <td key={c.title} className="text-center">
                              {score != null ? formatScore(score) : "—"}
                            </td>
                          );
                        })}
                        <td className="text-center font-semibold text-emerald-700">
                          {avg != null ? formatScore(avg) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {averages.size > 0 && (
              <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                {t.grades.classAverage} ({subject.name}) :{" "}
                <span className="font-semibold text-slate-900">
                  {formatScore(
                    [...students]
                      .map((s) =>
                        subjectAverages(
                          grades.filter((g) => g.student_id === s.id)
                        ).get(subject.id)
                      )
                      .filter((v): v is number => v != null)
                      .reduce((sum, v, _, arr) => sum + v / arr.length, 0)
                  )}
                </span>
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
