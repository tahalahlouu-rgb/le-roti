import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: boolean;
  class: { id: string; name: string } | null;
  parent: { id: string; first_name: string; last_name: string } | null;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classe?: string }>;
}) {
  const { q = "", classe = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select(
      "id, first_name, last_name, phone, is_active, class:classes(id, name), parent:profiles(id, first_name, last_name)"
    )
    .order("last_name")
    .order("first_name");
  if (classe) query = query.eq("class_id", classe);
  if (q) query = query.or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%`);

  const [{ data }, { data: classes }] = await Promise.all([
    query,
    supabase.from("classes").select("id, name").order("name"),
  ]);
  const students = (data ?? []) as unknown as StudentRow[];

  return (
    <>
      <PageHeader
        title={t.students.title}
        subtitle={`${students.length} ${
          students.length > 1 ? t.students.students : t.students.student
        }`}
        actions={
          <>
            <Link href="/direction/eleves/import" className="btn-secondary">
              <Icon name="upload" className="h-4 w-4" />
              {t.students.importCsv}
            </Link>
            <Link href="/direction/eleves/nouveau" className="btn-primary">
              <Icon name="plus" className="h-4 w-4" />
              {t.students.newStudent}
            </Link>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t.students.searchPlaceholder}
          className="input max-w-xs"
        />
        <select name="classe" defaultValue={classe} className="input max-w-45">
          <option value="">{t.students.allClasses}</option>
          {(classes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          {t.common.filter}
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState message={t.common.empty} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t.students.lastName}</th>
                <th>{t.students.firstName}</th>
                <th>{t.students.class}</th>
                <th className="hidden md:table-cell">{t.students.parent}</th>
                <th className="hidden md:table-cell">{t.students.phone}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">
                    {s.last_name}
                    {!s.is_active && (
                      <span className="ml-2">
                        <Badge tone="slate">—</Badge>
                      </span>
                    )}
                  </td>
                  <td>{s.first_name}</td>
                  <td>
                    {s.class ? (
                      <Badge tone="blue">{s.class.name}</Badge>
                    ) : (
                      <span className="text-slate-400">{t.students.noClass}</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">
                    {s.parent ? (
                      `${s.parent.first_name} ${s.parent.last_name}`
                    ) : (
                      <span className="text-slate-400">{t.students.noParent}</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">{s.phone ?? "—"}</td>
                  <td className="text-right">
                    <Link
                      href={`/direction/eleves/${s.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      {t.common.details}
                      <Icon name="chevronRight" className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
