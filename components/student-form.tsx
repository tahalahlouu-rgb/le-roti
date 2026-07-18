import { t } from "@/lib/i18n";
import type { Student } from "@/lib/types";
import { saveStudent } from "@/lib/actions/students";
import { ActionForm, SubmitButton } from "@/components/forms";

interface Option {
  id: string;
  label: string;
}

// Formulaire de création / édition d'un élève (rendu serveur,
// soumission via action serveur)
export function StudentForm({
  student,
  classes,
  parents,
}: {
  student?: Student;
  classes: Option[];
  parents: Option[];
}) {
  return (
    <ActionForm action={saveStudent} className="card max-w-2xl p-6">
      {student && <input type="hidden" name="id" value={student.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.lastName} *
          </label>
          <input
            name="last_name"
            required
            defaultValue={student?.last_name}
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
            defaultValue={student?.first_name}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.class}
          </label>
          <select
            name="class_id"
            defaultValue={student?.class_id ?? ""}
            className="input"
          >
            <option value="">{t.students.noClass}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.parent}
          </label>
          <select
            name="parent_id"
            defaultValue={student?.parent_id ?? ""}
            className="input"
          >
            <option value="">{t.students.noParent}</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.phone}
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={student?.phone ?? ""}
            className="input"
            placeholder="06 12 34 56 78"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.gender}
          </label>
          <select
            name="gender"
            defaultValue={student?.gender ?? ""}
            className="input"
          >
            <option value="">—</option>
            <option value="M">{t.students.male}</option>
            <option value="F">{t.students.female}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.birthDate}
          </label>
          <input
            name="birth_date"
            type="date"
            defaultValue={student?.birth_date ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.students.monthlyFee}
          </label>
          <input
            name="monthly_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={student?.monthly_fee ?? ""}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-500">
            {t.students.monthlyFeeHint}
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={student?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
        />
        {t.students.active}
      </label>

      <div className="mt-6">
        <SubmitButton>{t.common.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}
