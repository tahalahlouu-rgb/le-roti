import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, School, UserRole } from "@/lib/types";

export interface SessionProfile extends Profile {
  school: School;
}

// Profil de l'utilisateur connecté (null si non connecté ou sans profil)
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, school:schools(*)")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  return data as unknown as SessionProfile;
}

export function roleHome(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/direction";
    case "teacher":
      return "/enseignant";
    case "parent":
      return "/parent";
  }
}

// Garde de rôle des layouts : redirige vers la connexion si absent,
// vers l'espace du bon rôle si l'URL ne correspond pas.
export async function requireRole(role: UserRole): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/connexion");
  if (profile.role !== role) redirect(roleHome(profile.role));
  return profile;
}
