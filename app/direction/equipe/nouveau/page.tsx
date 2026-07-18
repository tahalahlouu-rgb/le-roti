import Link from "next/link";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { createAccount } from "@/lib/actions/users";

export default function NewAccountPage() {
  return (
    <>
      <Link
        href="/direction/equipe"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader title={t.team.newAccount} />

      <ActionForm action={createAccount} className="card max-w-xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.team.role} *
            </label>
            <select name="role" required className="input" defaultValue="parent">
              <option value="parent">{t.roles.parent}</option>
              <option value="teacher">{t.roles.teacher}</option>
            </select>
          </div>
          <div></div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.students.lastName} *
            </label>
            <input name="last_name" required className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.students.firstName} *
            </label>
            <input name="first_name" required className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.team.email} *
            </label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.students.phone}
            </label>
            <input name="phone" type="tel" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.team.initialPassword} *
            </label>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">{t.team.passwordHint}</p>
          </div>
        </div>
        <div className="mt-6">
          <SubmitButton>{t.common.save}</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
