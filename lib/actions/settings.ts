"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireAdminProfile,
  str,
  strOrNull,
  type ActionResult,
} from "./helpers";

const PAGE = "/direction/parametres";

export async function updateSchool(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const name = str(formData, "name");
  const academic_year = str(formData, "academic_year");
  if (!name || !academic_year) return { error: t.common.requiredFields };

  const { error } = await supabase
    .from("schools")
    .update({
      name,
      academic_year,
      address: strOrNull(formData, "address"),
      phone: strOrNull(formData, "phone"),
      email: strOrNull(formData, "email"),
    })
    .eq("id", profile.school_id);
  if (error) return { error: t.common.error };

  revalidatePath("/", "layout");
  return undefined;
}

export async function saveSubject(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const name = str(formData, "name");
  if (!name) return { error: t.common.requiredFields };

  const { error } = await supabase
    .from("subjects")
    .insert({ school_id: profile.school_id, name });
  if (error) {
    return { error: error.code === "23505" ? t.common.alreadyExists : t.common.error };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function deleteSubject(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) {
    return {
      error: error.code === "23503" ? t.settings.subjectInUse : t.common.error,
    };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function saveTerm(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = strOrNull(formData, "id");
  const name = str(formData, "name");
  const start_date = str(formData, "start_date");
  const end_date = str(formData, "end_date");
  if (!name || !start_date || !end_date) {
    return { error: t.common.requiredFields };
  }

  const values = {
    school_id: profile.school_id,
    name,
    academic_year:
      strOrNull(formData, "academic_year") ?? profile.school.academic_year,
    start_date,
    end_date,
  };

  const { error } = id
    ? await supabase.from("terms").update(values).eq("id", id)
    : await supabase.from("terms").insert(values);
  if (error) {
    return { error: error.code === "23505" ? t.common.alreadyExists : t.common.error };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function deleteTerm(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("terms")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  return undefined;
}
