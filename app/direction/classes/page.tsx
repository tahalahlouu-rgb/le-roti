import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatMAD } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import {
  saveLevel,
  deleteLevel,
  saveClass,
  deleteClass,
} from "@/lib/actions/classes";

interface LevelRow {
  id: string;
  name: string;
  display_order: number;
  default_monthly_fee: number | null;
}

interface ClassRow {
  id: string;
  name: string;
  academic_year: string;
  level: { id: string; name: string } | null;
  students: { count: number }[];
}

export default async function ClassesPage() {
  const supabase = await createClient();
  const [{ data: levelsData }, { data: classesData }] = await Promise.all([
    supabase.from("levels").select("*").order("display_order").order("name"),
    supabase
      .from("classes")
      .select("id, name, academic_year, level:levels(id, name), students(count)")
      .order("name"),
  ]);
  const levels = (levelsData ?? []) as LevelRow[];
  const classes = (classesData ?? []) as unknown as ClassRow[];

  return (
    <>
      <PageHeader title={t.classes.title} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Niveaux */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {t.classes.levels}
          </h2>
          <div className="card divide-y divide-slate-100">
            {levels.map((level) => (
              <div key={level.id} className="p-3">
                <ActionForm
                  action={saveLevel}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={level.id} />
                  <input
                    type="hidden"
                    name="display_order"
                    value={level.display_order}
                  />
                  <input
                    name="name"
                    defaultValue={level.name}
                    required
                    className="input w-28 flex-1"
                  />
                  <input
                    name="default_monthly_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={level.default_monthly_fee ?? ""}
                    placeholder={t.classes.defaultFee}
                    className="input w-36"
                    title={t.classes.defaultFee}
                  />
                  <SubmitButton className="btn-secondary">
                    {t.common.save}
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={deleteLevel} className="mt-1">
                  <input type="hidden" name="id" value={level.id} />
                  <ConfirmButton className="text-xs text-red-600 hover:underline">
                    {t.common.delete}
                  </ConfirmButton>
                </ActionForm>
              </div>
            ))}

            <div className="bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.classes.newLevel}
              </p>
              <ActionForm
                action={saveLevel}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  name="name"
                  required
                  placeholder={t.classes.levelName}
                  className="input w-28 flex-1"
                />
                <input
                  name="default_monthly_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t.classes.defaultFee}
                  className="input w-36"
                />
                <SubmitButton>{t.common.add}</SubmitButton>
              </ActionForm>
            </div>
          </div>
        </section>

        {/* Classes */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {t.classes.classes}
          </h2>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t.classes.className}</th>
                  <th>{t.classes.level}</th>
                  <th>{t.classes.studentsCount}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-900">{c.name}</td>
                    <td>{c.level?.name ?? "—"}</td>
                    <td>{c.students[0]?.count ?? 0}</td>
                    <td className="text-right">
                      <ActionForm action={deleteClass} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton className="text-xs text-red-600 hover:underline">
                          {t.common.delete}
                        </ConfirmButton>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t.classes.newClass}
              </p>
              <ActionForm
                action={saveClass}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  name="name"
                  required
                  placeholder={t.classes.className}
                  className="input w-32 flex-1"
                />
                <select name="level_id" required className="input w-36">
                  <option value="">{t.classes.level}…</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <SubmitButton>{t.common.add}</SubmitButton>
              </ActionForm>
            </div>
          </div>

          {levels.some((l) => l.default_monthly_fee != null) && (
            <p className="mt-3 text-xs text-slate-500">
              {t.classes.defaultFee} :{" "}
              {levels
                .filter((l) => l.default_monthly_fee != null)
                .map((l) => `${l.name} ${formatMAD(l.default_monthly_fee!)}`)
                .join(" · ")}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
