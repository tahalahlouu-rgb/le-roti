"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getSessionProfile } from "@/lib/auth";
import {
  requireAdminProfile,
  str,
  type ActionResult,
} from "./helpers";
import type { Attendance } from "@/lib/types";

// Enregistre l'appel d'une classe pour un jour : un champ
// status_<eleveId> ∈ {present, absence, late} par élève. On ne touche
// qu'aux différences pour préserver le drapeau « justifiée » des
// enregistrements inchangés. Enseignant (ses classes) ou direction.
export async function saveAttendance(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await getSessionProfile();
  if (!profile || profile.role === "parent") {
    return { error: t.common.forbidden };
  }
  const supabase = await createClient();

  const class_id = str(formData, "class_id");
  const date = str(formData, "date");
  if (!class_id || !date) return { error: t.common.requiredFields };

  const desired = new Map<string, "present" | "absence" | "late">();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status_")) continue;
    const status = String(value);
    if (!["present", "absence", "late"].includes(status)) continue;
    desired.set(key.slice("status_".length), status as never);
  }
  if (desired.size === 0) return { error: t.common.requiredFields };

  const { data: existingData, error: fetchError } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", class_id)
    .eq("date", date);
  if (fetchError) return { error: t.common.error };
  const existing = (existingData ?? []) as Attendance[];

  const toDelete: string[] = [];
  const inserts = [];
  for (const [studentId, status] of desired) {
    const rows = existing.filter((r) => r.student_id === studentId);
    for (const row of rows) {
      if (row.type !== status) toDelete.push(row.id);
    }
    if (status !== "present" && !rows.some((r) => r.type === status)) {
      inserts.push({
        school_id: profile.school_id,
        student_id: studentId,
        class_id,
        date,
        type: status,
        recorded_by: profile.id,
      });
    }
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .in("id", toDelete);
    if (error) return { error: t.common.error };
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from("attendance").insert(inserts);
    if (error) return { error: t.common.error };
  }

  revalidatePath(`/enseignant/classes/${class_id}/absences`);
  revalidatePath("/direction/absences");
  return undefined;
}

// Bascule le statut « justifiée » d'une absence (direction)
export async function toggleJustified(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance")
    .update({ justified: str(formData, "justified") === "true" })
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath("/direction/absences");
  return undefined;
}
