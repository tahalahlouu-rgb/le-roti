"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { t } from "@/lib/i18n";
import type { ActionResult } from "@/lib/actions/helpers";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

// Formulaire branché sur une action serveur, avec affichage d'erreur.
// Les champs sont passés en children depuis les Server Components.
export function ActionForm({
  action,
  className,
  children,
}: {
  action: Action;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? t.common.loading : children}
    </button>
  );
}

// Bouton de soumission avec confirmation (suppressions)
export function ConfirmButton({
  children,
  className = "btn-danger",
  message,
}: {
  children: React.ReactNode;
  className?: string;
  message?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message ?? t.common.deleteConfirm)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
