"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireAdminProfile,
  str,
  strOrNull,
  numOrNull,
  type ActionResult,
} from "./helpers";

const PAGE = "/direction/classes";

export async function saveLevel(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = strOrNull(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: t.common.requiredFields };

  const values = {
    school_id: profile.school_id,
    name,
    default_monthly_fee: numOrNull(formData, "default_monthly_fee"),
    display_order: numOrNull(formData, "display_order") ?? 0,
  };

  const { error } = id
    ? await supabase.from("levels").update(values).eq("id", id)
    : await supabase.from("levels").insert(values);
  if (error) {
    return { error: error.code === "23505" ? t.common.alreadyExists : t.common.error };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function deleteLevel(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("levels")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) {
    return { error: error.code === "23503" ? t.classes.levelInUse : t.common.error };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function saveClass(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = strOrNull(formData, "id");
  const name = str(formData, "name");
  const level_id = strOrNull(formData, "level_id");
  if (!name || !level_id) return { error: t.common.requiredFields };

  const values = {
    school_id: profile.school_id,
    name,
    level_id,
    academic_year:
      strOrNull(formData, "academic_year") ?? profile.school.academic_year,
  };

  const { error } = id
    ? await supabase.from("classes").update(values).eq("id", id)
    : await supabase.from("classes").insert(values);
  if (error) {
    return { error: error.code === "23505" ? t.common.alreadyExists : t.common.error };
  }
  revalidatePath(PAGE);
  return undefined;
}

export async function deleteClass(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  revalidatePath("/direction/eleves");
  return undefined;
}
