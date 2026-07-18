import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

interface ProfileRow {
  id: string;
  role: "admin" | "teacher" | "parent";
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

export default async function TeamPage() {
  const supabase = await createClient();
  const [{ data: profilesData }, { data: assignments }, { data: students }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, first_name, last_name, email, phone")
        .order("last_name"),
      supabase.from("teacher_assignments").select("teacher_id, class_id"),
      supabase.from("students").select("id, parent_id"),
    ]);
  const profiles = (profilesData ?? []) as ProfileRow[];
  const teachers = profiles.filter((p) => p.role === "teacher");
  const parents = profiles.filter((p) => p.role === "parent");

  const classCount = new Map<string, Set<string>>();
  for (const a of assignments ?? []) {
    if (!classCount.has(a.teacher_id)) classCount.set(a.teacher_id, new Set());
    classCount.get(a.teacher_id)!.add(a.class_id);
  }
  const childCount = new Map<string, number>();
  for (const s of students ?? []) {
    if (s.parent_id) {
      childCount.set(s.parent_id, (childCount.get(s.parent_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <PageHeader
        title={t.team.title}
        actions={
          <Link href="/direction/equipe/nouveau" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            {t.team.newAccount}
          </Link>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          {t.team.teachers} ({teachers.length})
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t.team.fullName}</th>
                <th className="hidden sm:table-cell">{t.auth.email}</th>
                <th>{t.team.classesCount}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="hidden sm:table-cell">{p.email ?? "—"}</td>
                  <td>{classCount.get(p.id)?.size ?? 0}</td>
                  <td className="text-right">
                    <Link
                      href={`/direction/equipe/${p.id}`}
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      {t.team.assignments} →
                    </Link>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-slate-400">
                    {t.common.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          {t.team.parents} ({parents.length})
        </h2>
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t.team.fullName}</th>
                <th className="hidden sm:table-cell">{t.auth.email}</th>
                <th className="hidden sm:table-cell">{t.students.phone}</th>
                <th>{t.team.childrenCount}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="hidden sm:table-cell">{p.email ?? "—"}</td>
                  <td className="hidden sm:table-cell">{p.phone ?? "—"}</td>
                  <td>{childCount.get(p.id) ?? 0}</td>
                  <td className="text-right">
                    <Link
                      href={`/direction/equipe/${p.id}`}
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      {t.common.edit} →
                    </Link>
                  </td>
                </tr>
              ))}
              {parents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    {t.common.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
