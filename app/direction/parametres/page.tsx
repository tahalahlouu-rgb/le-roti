import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import {
  updateSchool,
  saveSubject,
  deleteSubject,
  saveTerm,
  deleteTerm,
} from "@/lib/actions/settings";
import type { Subject, Term } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [{ data: subjectsData }, { data: termsData }] = await Promise.all([
    supabase.from("subjects").select("*").order("name"),
    supabase.from("terms").select("*").order("start_date"),
  ]);
  const subjects = (subjectsData ?? []) as Subject[];
  const terms = (termsData ?? []) as Term[];
  const school = profile.school;

  return (
    <>
      <PageHeader title={t.settings.title} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            {t.settings.school}
          </h2>
          <ActionForm action={updateSchool}>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.settings.schoolName} *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={school.name}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.settings.address}
                </label>
                <input
                  name="address"
                  defaultValue={school.address ?? ""}
                  className="input"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.settings.phone}
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={school.phone ?? ""}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.settings.email}
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={school.email ?? ""}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.settings.academicYear} *
                </label>
                <input
                  name="academic_year"
                  required
                  defaultValue={school.academic_year}
                  className="input max-w-40"
                  placeholder="2025-2026"
                />
              </div>
            </div>
            <div className="mt-5">
              <SubmitButton>{t.common.save}</SubmitButton>
            </div>
          </ActionForm>
        </section>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.settings.subjects}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1.5 text-sm text-slate-700"
                >
                  {s.name}
                  <ActionForm action={deleteSubject} className="inline-flex">
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                      ×
                    </ConfirmButton>
                  </ActionForm>
                </li>
              ))}
              {subjects.length === 0 && (
                <li className="text-sm text-slate-400">{t.common.empty}</li>
              )}
            </ul>
            <ActionForm
              action={saveSubject}
              className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4"
            >
              <input
                name="name"
                required
                placeholder={t.settings.subjectName}
                className="input max-w-56"
              />
              <SubmitButton>{t.common.add}</SubmitButton>
            </ActionForm>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {t.settings.terms}
            </h2>
            <ul className="space-y-2">
              {terms.map((term) => (
                <li
                  key={term.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{term.name}</span>
                  <span className="text-slate-500">
                    {formatDate(term.start_date)} → {formatDate(term.end_date)}
                  </span>
                  <ActionForm action={deleteTerm}>
                    <input type="hidden" name="id" value={term.id} />
                    <ConfirmButton className="text-xs text-red-600 hover:underline">
                      {t.common.delete}
                    </ConfirmButton>
                  </ActionForm>
                </li>
              ))}
              {terms.length === 0 && (
                <li className="text-sm text-slate-400">{t.common.empty}</li>
              )}
            </ul>
            <ActionForm
              action={saveTerm}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4"
            >
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  {t.settings.termName}
                </label>
                <input
                  name="name"
                  required
                  placeholder="Trimestre 1"
                  className="input w-36"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  {t.settings.startDate}
                </label>
                <input name="start_date" type="date" required className="input w-38" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  {t.settings.endDate}
                </label>
                <input name="end_date" type="date" required className="input w-38" />
              </div>
              <SubmitButton>{t.common.add}</SubmitButton>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  );
}
