"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireTeacherProfile,
  str,
  strOrNull,
  numOrNull,
  type ActionResult,
} from "./helpers";

// Enregistre un contrôle pour toute une classe : un champ score_<eleveId>
// par élève, les champs vides sont ignorés. Le RLS garantit que
// l'enseignant ne peut écrire que sur ses couples (classe, matière).
export async function addGradesBatch(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireTeacherProfile();
  const supabase = await createClient();

  const class_id = str(formData, "class_id");
  const subject_id = str(formData, "subject_id");
  const term_id = str(formData, "term_id");
  const title = str(formData, "title");
  const graded_on = strOrNull(formData, "graded_on");
  const coefficient = numOrNull(formData, "coefficient") ?? 1;
  if (!class_id || !subject_id || !term_id || !title) {
    return { error: t.common.requiredFields };
  }
  if (coefficient <= 0) return { error: t.grades.invalidScore };

  const rows = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("score_")) continue;
    const raw = String(value).trim().replace(",", ".");
    if (raw === "") continue;
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > 20) {
      return { error: t.grades.invalidScore };
    }
    rows.push({
      school_id: profile.school_id,
      student_id: key.slice("score_".length),
      class_id,
      subject_id,
      teacher_id: profile.id,
      term_id,
      title,
      score,
      coefficient,
      graded_on: graded_on ?? undefined,
    });
  }
  if (rows.length === 0) return { error: t.grades.noScores };

  const { error } = await supabase.from("grades").insert(rows);
  if (error) return { error: t.common.error };

  revalidatePath(`/enseignant/classes/${class_id}/notes`);
  return undefined;
}

// Supprime un contrôle entier (toutes les notes portant ce titre
// pour la classe / matière / trimestre)
export async function deleteGradeSet(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireTeacherProfile();
  const supabase = await createClient();

  const class_id = str(formData, "class_id");
  const { error } = await supabase
    .from("grades")
    .delete()
    .eq("class_id", class_id)
    .eq("subject_id", str(formData, "subject_id"))
    .eq("term_id", str(formData, "term_id"))
    .eq("title", str(formData, "title"));
  if (error) return { error: t.common.error };

  revalidatePath(`/enseignant/classes/${class_id}/notes`);
  return undefined;
}
