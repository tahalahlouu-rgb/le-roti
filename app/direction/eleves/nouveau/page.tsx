import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { StudentForm } from "@/components/student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const [{ data: classes }, { data: parents }] = await Promise.all([
    supabase.from("classes").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "parent")
      .order("last_name"),
  ]);

  return (
    <>
      <Link
        href="/direction/eleves"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader title={t.students.newStudent} />
      <StudentForm
        classes={(classes ?? []).map((c) => ({ id: c.id, label: c.name }))}
        parents={(parents ?? []).map((p) => ({
          id: p.id,
          label: `${p.first_name} ${p.last_name}`,
        }))}
      />
    </>
  );
}
