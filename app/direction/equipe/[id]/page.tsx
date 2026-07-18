import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { PageHeader, Badge } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import {
  updateAccount,
  deleteAccount,
  addAssignment,
  deleteAssignment,
} from "@/lib/actions/users";
import type { Profile } from "@/lib/types";

interface AssignmentRow {
  id: string;
  class: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (!profileData) notFound();
  const profile = profileData as Profile & { email: string | null };

  const isTeacher = profile.role === "teacher";
  const [{ data: assignmentsData }, { data: classes }, { data: subjects }] =
    await Promise.all([
      isTeacher
        ? supabase
            .from("teacher_assignments")
            .select("id, class:classes(id, name), subject:subjects(id, name)")
            .eq("teacher_id", id)
        : Promise.resolve({ data: [] }),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("subjects").select("id, name").order("name"),
    ]);
  const assignments = (assignmentsData ?? []) as unknown as AssignmentRow[];

  return (
    <>
      <Link
        href="/direction/equipe"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader
        title={`${profile.first_name} ${profile.last_name}`}
        subtitle={`${t.roles[profile.role]}${profile.email ? ` · ${profile.email}` : ""}`}
        actions={
          <ActionForm action={deleteAccount}>
            <input type="hidden" name="id" value={profile.id} />
            <ConfirmButton message={t.team.deleteAccountWarning}>
              {t.common.delete}
            </ConfirmButton>
          </ActionForm>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            {t.team.editAccount}
          </h2>
          <ActionForm action={updateAccount}>
            <input type="hidden" name="id" value={profile.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.students.lastName} *
                </label>
                <input
                  name="last_name"
                  required
                  defaultValue={profile.last_name}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.students.firstName} *
                </label>
                <input
                  name="first_name"
                  required
                  defaultValue={profile.first_name}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.students.phone}
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone ?? ""}
                  className="input"
                />
              </div>
            </div>
            <div className="mt-5">
              <SubmitButton>{t.common.save}</SubmitButton>
            </div>
          </ActionForm>
        </section>

        {isTeacher && (
          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.team.assignments}
            </h2>
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <Badge tone="blue">{a.class?.name ?? "—"}</Badge>
                    {a.subject?.name ?? "—"}
                  </span>
                  <ActionForm action={deleteAssignment}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="teacher_id" value={profile.id} />
                    <ConfirmButton className="text-xs text-red-600 hover:underline">
                      {t.common.delete}
                    </ConfirmButton>
                  </ActionForm>
                </li>
              ))}
              {assignments.length === 0 && (
                <li className="text-sm text-slate-400">{t.common.empty}</li>
              )}
            </ul>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.team.addAssignment}
              </p>
              <ActionForm
                action={addAssignment}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="teacher_id" value={profile.id} />
                <select name="class_id" required className="input w-36">
                  <option value="">{t.students.class}…</option>
                  {(classes ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select name="subject_id" required className="input w-44">
                  <option value="">{t.team.subject}…</option>
                  {(subjects ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <SubmitButton>{t.common.add}</SubmitButton>
              </ActionForm>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
