import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";

interface ChildRow {
  id: string;
  first_name: string;
  last_name: string;
  class: { name: string } | null;
}

// Fiche enfant côté parent — les sections notes, absences et
// paiements sont ajoutées par les modules 2 à 4.
export default async function ChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, class:classes(name)")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const child = data as unknown as ChildRow;

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
      <p className="text-sm text-slate-500">{t.common.empty}</p>
    </>
  );
}
