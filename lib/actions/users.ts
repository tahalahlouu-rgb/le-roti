"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireAdminProfile,
  str,
  strOrNull,
  type ActionResult,
} from "./helpers";

const PAGE = "/direction/equipe";

// Création d'un compte enseignant ou parent par la direction
// (pas d'auto-inscription). Utilise la clé service role.
export async function createAccount(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();

  const role = str(formData, "role");
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  if (!["teacher", "parent"].includes(role) || !first_name || !last_name || !email) {
    return { error: t.common.requiredFields };
  }
  if (password.length < 8) return { error: t.team.passwordHint };

  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    const taken = authError?.message?.toLowerCase().includes("already");
    return { error: taken ? t.team.emailTaken : t.common.error };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    school_id: profile.school_id,
    role,
    first_name,
    last_name,
    email,
    phone: strOrNull(formData, "phone"),
  });
  if (profileError) {
    // Ne pas laisser un utilisateur auth orphelin
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: t.common.error };
  }

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function updateAccount(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = str(formData, "id");
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  if (!id || !first_name || !last_name) return { error: t.common.requiredFields };

  const { error } = await supabase
    .from("profiles")
    .update({ first_name, last_name, phone: strOrNull(formData, "phone") })
    .eq("id", id)
    .eq("school_id", profile.school_id);
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  return undefined;
}

export async function deleteAccount(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const id = str(formData, "id");
  if (!id || id === profile.id) return { error: t.common.forbidden };

  const admin = createAdminClient();
  // Vérifier que le compte appartient bien à l'école de l'admin
  const { data: target } = await admin
    .from("profiles")
    .select("id, school_id")
    .eq("id", id)
    .single();
  if (!target || target.school_id !== profile.school_id) {
    return { error: t.common.forbidden };
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function addAssignment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const teacher_id = str(formData, "teacher_id");
  const class_id = str(formData, "class_id");
  const subject_id = str(formData, "subject_id");
  if (!teacher_id || !class_id || !subject_id) {
    return { error: t.common.requiredFields };
  }

  const { error } = await supabase.from("teacher_assignments").insert({
    school_id: profile.school_id,
    teacher_id,
    class_id,
    subject_id,
  });
  if (error) {
    return { error: error.code === "23505" ? t.common.alreadyExists : t.common.error };
  }

  revalidatePath(`${PAGE}/${teacher_id}`);
  return undefined;
}

export async function deleteAssignment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("teacher_assignments")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath(`${PAGE}/${str(formData, "teacher_id")}`);
  return undefined;
}
