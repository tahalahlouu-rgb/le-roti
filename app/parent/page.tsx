import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

interface ChildRow {
  id: string;
  first_name: string;
  last_name: string;
  class: { name: string } | null;
}

// Accueil parent : la liste de ses enfants (les onglets notes /
// absences / paiements arrivent avec les modules suivants)
export default async function ParentHomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, class:classes(name)")
    .order("first_name");
  const children = (data ?? []) as unknown as ChildRow[];

  return (
    <>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        {t.parentHome.myChildren}
      </h1>
      {children.length === 0 ? (
        <EmptyState message={t.parentHome.noChildren} />
      ) : (
        <ul className="space-y-3">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/parent/enfants/${child.id}`}
                className="card flex items-center justify-between p-4 transition-colors hover:border-emerald-600"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">
                    {child.first_name[0]}
                    {child.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {child.class?.name ?? t.students.noClass}
                    </p>
                  </div>
                </div>
                <Icon name="chevronRight" className="h-5 w-5 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
