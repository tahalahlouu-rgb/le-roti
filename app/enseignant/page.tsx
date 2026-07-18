import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";

interface AssignmentRow {
  id: string;
  class: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
}

export default async function TeacherHomePage() {
  await requireRole("teacher");
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("id, class:classes(id, name), subject:subjects(id, name)");
  const assignments = (data ?? []) as unknown as AssignmentRow[];

  // Regrouper par classe
  const byClass = new Map<
    string,
    { name: string; subjects: { id: string; name: string }[] }
  >();
  for (const a of assignments) {
    if (!a.class || !a.subject) continue;
    if (!byClass.has(a.class.id)) {
      byClass.set(a.class.id, { name: a.class.name, subjects: [] });
    }
    byClass.get(a.class.id)!.subjects.push(a.subject);
  }
  const classes = [...byClass.entries()].sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  return (
    <>
      <PageHeader title={t.nav.myClasses} subtitle={t.teacherHome.intro} />
      {classes.length === 0 ? (
        <EmptyState message={t.teacherHome.noAssignments} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map(([classId, c]) => (
            <div key={classId} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {c.name}
                </h2>
                <Icon name="cap" className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {c.subjects.map((s) => (
                  <Badge key={s.id} tone="slate">
                    {s.name}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/enseignant/classes/${classId}/notes`}
                  className="btn-primary flex-1"
                >
                  <Icon name="book" className="h-4 w-4" />
                  {t.teacherHome.gradesAction}
                </Link>
                <Link
                  href={`/enseignant/classes/${classId}/absences`}
                  className="btn-secondary flex-1"
                >
                  <Icon name="calendarX" className="h-4 w-4" />
                  {t.teacherHome.attendanceAction}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
