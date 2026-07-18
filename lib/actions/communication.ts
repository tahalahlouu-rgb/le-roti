"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getSessionProfile } from "@/lib/auth";
import {
  requireAdminProfile,
  requireParentProfile,
  str,
  type ActionResult,
} from "./helpers";

// --------------------------------------------------------------
// Annonces (direction)
// --------------------------------------------------------------
export async function saveAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const supabase = await createClient();

  const title = str(formData, "title");
  const body = str(formData, "body");
  if (!title || !body) return { error: t.common.requiredFields };

  const { error } = await supabase.from("announcements").insert({
    school_id: profile.school_id,
    author_id: profile.id,
    title,
    body,
    pinned: formData.get("pinned") === "on",
  });
  if (error) return { error: t.common.error };

  revalidatePath("/direction/annonces");
  revalidatePath("/parent/annonces");
  return undefined;
}

export async function deleteAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath("/direction/annonces");
  revalidatePath("/parent/annonces");
  return undefined;
}

export async function togglePinned(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update({ pinned: str(formData, "pinned") === "true" })
    .eq("id", str(formData, "id"));
  if (error) return { error: t.common.error };

  revalidatePath("/direction/annonces");
  revalidatePath("/parent/annonces");
  return undefined;
}

// --------------------------------------------------------------
// Messagerie parent ↔ direction
// --------------------------------------------------------------

// Un parent ouvre un fil avec la direction (objet + premier message)
export async function startConversation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireParentProfile();
  const supabase = await createClient();

  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!subject || !body) return { error: t.common.requiredFields };

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      school_id: profile.school_id,
      parent_id: profile.id,
      subject,
    })
    .select("id")
    .single();
  if (error || !conversation) return { error: t.common.error };

  const { error: messageError } = await supabase.from("messages").insert({
    school_id: profile.school_id,
    conversation_id: conversation.id,
    sender_id: profile.id,
    body,
  });
  if (messageError) return { error: t.common.error };

  revalidatePath("/parent/messagerie");
  revalidatePath("/direction/messagerie");
  redirect(`/parent/messagerie/${conversation.id}`);
}

// Réponse dans un fil existant (parent ou direction — RLS vérifie
// que l'expéditeur est bien participant)
export async function sendMessage(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: t.common.forbidden };
  const supabase = await createClient();

  const conversation_id = str(formData, "conversation_id");
  const body = str(formData, "body");
  if (!conversation_id || !body) return { error: t.common.requiredFields };

  const { error } = await supabase.from("messages").insert({
    school_id: profile.school_id,
    conversation_id,
    sender_id: profile.id,
    body,
  });
  if (error) return { error: t.common.error };

  revalidatePath(`/parent/messagerie/${conversation_id}`);
  revalidatePath(`/direction/messagerie/${conversation_id}`);
  return undefined;
}
