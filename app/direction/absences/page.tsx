import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatMonth, todayISO } from "@/lib/format";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { toggleJustified } from "@/lib/actions/attendance";
import type { AttendanceType } from "@/lib/types";

interface DayRow {
  id: string;
  type: AttendanceType;
  justified: boolean;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class: { name: string } | null;
  } | null;
}

interface MonthRow {
  student_id: string;
  type: AttendanceType;
  student: {
    first_name: string;
    last_name: string;
    class: { name: string } | null;
  } | null;
}

function monthBounds(month: string): { start: string; end: string } {
  const [year, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
  return { start, end: `${next}-01` };
}

export default async function DirectionAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; mois?: string }>;
}) {
  const { date: dateParam, mois } = await searchParams;
  const supabase = await createClient();

  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? dateParam!
    : todayISO();
  const month = /^\d{4}-\d{2}$/.test(mois ?? "") ? mois! : date.slice(0, 7);
  const { start, end } = monthBounds(month);

  const [{ data: dayData }, { data: monthData }] = await Promise.all([
    supabase
      .from("attendance")
      .select(
        "id, type, justified, student:students(id, first_name, last_name, class:classes(name))"
      )
      .eq("date", date)
      .order("type"),
    supabase
      .from("attendance")
      .select(
        "student_id, type, student:students(first_name, last_name, class:classes(name))"
      )
      .gte("date", start)
      .lt("date", end),
  ]);
  const dayRows = (dayData ?? []) as unknown as DayRow[];
  const monthRows = (monthData ?? []) as unknown as MonthRow[];

  // Compteurs par élève pour le mois
  const counters = new Map<
    string,
    { name: string; className: string; absences: number; lates: number }
  >();
  for (const row of monthRows) {
    if (!row.student) continue;
    const entry = counters.get(row.student_id) ?? {
      name: `${row.student.last_name} ${row.student.first_name}`,
      className: row.student.class?.name ?? "—",
      absences: 0,
      lates: 0,
    };
    if (row.type === "absence") entry.absences++;
    else entry.lates++;
    counters.set(row.student_id, entry);
  }
  const counterRows = [...counters.values()].sort(
    (a, b) => b.absences - a.absences || b.lates - a.lates
  );

  return (
    <>
      <PageHeader title={t.attendance.title} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Jour */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {t.attendance.dayTitle}
            </h2>
            <form method="get" className="flex gap-2">
              <input type="hidden" name="mois" value={month} />
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="input w-40"
              />
              <button type="submit" className="btn-secondary">
                {t.common.filter}
              </button>
            </form>
          </div>

          {dayRows.length === 0 ? (
            <EmptyState message={t.attendance.noneToday} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t.students.title}</th>
                    <th>{t.students.class}</th>
                    <th>{t.common.status}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dayRows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-900">
                        {row.student
                          ? `${row.student.last_name} ${row.student.first_name}`
                          : "—"}
                      </td>
                      <td>{row.student?.class?.name ?? "—"}</td>
                      <td>
                        <Badge tone={row.type === "absence" ? "red" : "amber"}>
                          {row.type === "absence"
                            ? t.attendance.absence
                            : t.attendance.late}
                        </Badge>{" "}
                        {row.justified && (
                          <Badge tone="green">{t.attendance.justified}</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <ActionForm action={toggleJustified} className="inline">
                          <input type="hidden" name="id" value={row.id} />
                          <input
                            type="hidden"
                            name="justified"
                            value={row.justified ? "false" : "true"}
                          />
                          <SubmitButton className="text-xs font-medium text-emerald-700 hover:underline">
                            {row.justified
                              ? t.attendance.unmarkJustified
                              : t.attendance.markJustified}
                          </SubmitButton>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Mois */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {t.attendance.monthTitle} — {formatMonth(start)}
            </h2>
            <form method="get" className="flex gap-2">
              <input type="hidden" name="date" value={date} />
              <input
                type="month"
                name="mois"
                defaultValue={month}
                className="input w-40"
              />
              <button type="submit" className="btn-secondary">
                {t.common.filter}
              </button>
            </form>
          </div>

          {counterRows.length === 0 ? (
            <EmptyState message={t.attendance.noneThisMonth} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t.students.title}</th>
                    <th>{t.students.class}</th>
                    <th className="text-center">{t.attendance.absences}</th>
                    <th className="text-center">{t.attendance.lates}</th>
                  </tr>
                </thead>
                <tbody>
                  {counterRows.map((row) => (
                    <tr key={row.name}>
                      <td className="font-medium text-slate-900">{row.name}</td>
                      <td>{row.className}</td>
                      <td className="text-center">
                        {row.absences > 0 ? (
                          <span className="font-semibold text-red-700">
                            {row.absences}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="text-center">
                        {row.lates > 0 ? (
                          <span className="font-semibold text-amber-700">
                            {row.lates}
                          </span>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
