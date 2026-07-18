import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { StudentForm } from "@/components/student-form";
import { ActionForm, ConfirmButton } from "@/components/forms";
import { deleteStudent } from "@/lib/actions/students";
import type { Student } from "@/lib/types";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: student }, { data: classes }, { data: parents }] =
    await Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("classes").select("id, name").order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "parent")
        .order("last_name"),
    ]);
  if (!student) notFound();
  const s = student as Student;

  return (
    <>
      <Link
        href="/direction/eleves"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader
        title={`${s.first_name} ${s.last_name}`}
        subtitle={t.students.editStudent}
        actions={
          <ActionForm action={deleteStudent}>
            <input type="hidden" name="id" value={s.id} />
            <ConfirmButton message={t.students.deleteWarning}>
              {t.common.delete}
            </ConfirmButton>
          </ActionForm>
        }
      />
      <StudentForm
        student={s}
        classes={(classes ?? []).map((c) => ({ id: c.id, label: c.name }))}
        parents={(parents ?? []).map((p) => ({
          id: p.id,
          label: `${p.first_name} ${p.last_name}`,
        }))}
      />
    </>
  );
}
