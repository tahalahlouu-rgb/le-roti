"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  requireAdminProfile,
  str,
  type ActionResult,
} from "./helpers";

const PAGE = "/direction/paiements";

interface StudentFee {
  id: string;
  monthly_fee: number | null;
  class: { level: { default_monthly_fee: number | null } | null } | null;
}

// Crée les mensualités du mois pour tous les élèves scolarisés :
// tarif de l'élève s'il est défini, sinon tarif par défaut du niveau.
// Les mensualités déjà existantes ne sont pas modifiées.
export async function generateMonth(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const monthParam = str(formData, "month"); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(monthParam)) return { error: t.common.requiredFields };
  const month = `${monthParam}-01`;

  const [{ data: studentsData }, { data: existing }] = await Promise.all([
    supabase
      .from("students")
      .select("id, monthly_fee, class:classes(level:levels(default_monthly_fee))")
      .eq("is_active", true),
    supabase.from("payments").select("student_id").eq("month", month),
  ]);
  const students = (studentsData ?? []) as unknown as StudentFee[];
  const alreadyBilled = new Set((existing ?? []).map((p) => p.student_id));

  const inserts = [];
  for (const student of students) {
    if (alreadyBilled.has(student.id)) continue;
    const fee =
      student.monthly_fee ?? student.class?.level?.default_monthly_fee ?? null;
    if (fee == null || Number(fee) <= 0) continue;
    inserts.push({
      school_id: profile.school_id,
      student_id: student.id,
      month,
      amount: Number(fee),
      status: "unpaid" as const,
    });
  }

  if (inserts.length === 0) return { error: t.payments.noneGenerated };

  const { error } = await supabase.from("payments").insert(inserts);
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  return undefined;
}

// Prochain numéro de reçu, séquentiel par école et par année :
// REC-2026-0001, REC-2026-0002, …
async function nextReceiptNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REC-${year}-`;
  const { data } = await supabase
    .from("payments")
    .select("receipt_number")
    .eq("school_id", schoolId)
    .like("receipt_number", `${prefix}%`)
    .order("receipt_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = data?.receipt_number
    ? parseInt(String(data.receipt_number).slice(prefix.length), 10)
    : 0;
  return `${prefix}${String(last + 1).padStart(4, "0")}`;
}

// Enregistre un règlement manuel (espèces, chèque, virement)
export async function markPaid(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const id = str(formData, "id");
  const method = str(formData, "method");
  if (!id || !["cash", "cheque", "transfer"].includes(method)) {
    return { error: t.common.requiredFields };
  }

  // Deux tentatives en cas de collision sur le numéro de reçu
  for (let attempt = 0; attempt < 2; attempt++) {
    const receipt_number = await nextReceiptNumber(supabase, profile.school_id);
    const { error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        method,
        receipt_number,
        recorded_by: profile.id,
      })
      .eq("id", id)
      .eq("status", "unpaid");
    if (!error) break;
    if (error.code !== "23505" || attempt === 1) {
      return { error: t.common.error };
    }
  }

  revalidatePath(PAGE);
  return undefined;
}

// Annule un règlement (le reçu émis n'est plus valable)
export async function markUnpaid(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payments")
    .update({
      status: "unpaid",
      paid_at: null,
      method: null,
      receipt_number: null,
      recorded_by: null,
    })
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  return undefined;
}

// Supprime une mensualité créée par erreur
export async function deletePayment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath(PAGE);
  return undefined;
}
