"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireAdminProfile,
  str,
  strOrNull,
  numOrNull,
  type ActionResult,
} from "./helpers";

export async function saveStudent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = strOrNull(formData, "id");
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  if (!first_name || !last_name) return { error: t.common.requiredFields };

  const values = {
    school_id: profile.school_id,
    first_name,
    last_name,
    class_id: strOrNull(formData, "class_id"),
    parent_id: strOrNull(formData, "parent_id"),
    phone: strOrNull(formData, "phone"),
    gender: strOrNull(formData, "gender"),
    birth_date: strOrNull(formData, "birth_date"),
    monthly_fee: numOrNull(formData, "monthly_fee"),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("students").update(values).eq("id", id)
    : await supabase.from("students").insert(values);
  if (error) return { error: t.common.error };

  revalidatePath("/direction/eleves");
  redirect("/direction/eleves");
}

export async function deleteStudent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath("/direction/eleves");
  redirect("/direction/eleves");
}

export interface CsvRow {
  first_name: string;
  last_name: string;
  class_name: string;
  phone: string;
  parent_email: string;
}

export interface ImportReport {
  imported: number;
  warnings: string[];
  error?: string;
}

// Import CSV : les classes sont résolues par nom, les parents par
// e-mail de compte. Les lignes sans nom/prénom sont ignorées.
export async function importStudents(rows: CsvRow[]): Promise<ImportReport> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const [{ data: classes }, { data: parents }] = await Promise.all([
    supabase.from("classes").select("id, name"),
    supabase.from("profiles").select("id, email").eq("role", "parent"),
  ]);

  const classByName = new Map(
    (classes ?? []).map((c) => [c.name.toLowerCase(), c.id])
  );
  const parentByEmail = new Map(
    (parents ?? [])
      .filter((p) => p.email)
      .map((p) => [String(p.email).toLowerCase(), p.id])
  );

  const warnings: string[] = [];
  const inserts = [];

  for (const [index, row] of rows.entries()) {
    const line = index + 2; // ligne 1 = en-tête
    if (!row.first_name.trim() || !row.last_name.trim()) {
      warnings.push(`${t.csv.line} ${line} : ${t.csv.missingName}`);
      continue;
    }

    let class_id: string | null = null;
    if (row.class_name.trim()) {
      class_id = classByName.get(row.class_name.trim().toLowerCase()) ?? null;
      if (!class_id) {
        warnings.push(
          `${t.csv.line} ${line} : ${t.csv.unknownClass} « ${row.class_name.trim()} »`
        );
      }
    }

    let parent_id: string | null = null;
    if (row.parent_email.trim()) {
      parent_id =
        parentByEmail.get(row.parent_email.trim().toLowerCase()) ?? null;
      if (!parent_id) {
        warnings.push(`${t.csv.line} ${line} : ${t.csv.unknownParent}`);
      }
    }

    inserts.push({
      school_id: profile.school_id,
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      class_id,
      parent_id,
      phone: row.phone.trim() || null,
    });
  }

  if (inserts.length === 0) {
    return { imported: 0, warnings, error: t.csv.emptyFile };
  }

  const { error } = await supabase.from("students").insert(inserts);
  if (error) return { imported: 0, warnings, error: t.common.error };

  revalidatePath("/direction/eleves");
  return { imported: inserts.length, warnings };
}
