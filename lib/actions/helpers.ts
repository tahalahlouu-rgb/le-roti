import "server-only";
import { getSessionProfile, type SessionProfile } from "@/lib/auth";

// Résultat standard des actions serveur utilisées avec useActionState
export type ActionResult = { error: string } | undefined;

// Les politiques RLS protègent déjà la base ; cette vérification
// explicite donne des erreurs propres et protège les chemins qui
// utilisent le client service role.
export async function requireAdminProfile(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("FORBIDDEN");
  return profile;
}

export async function requireTeacherProfile(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "teacher") throw new Error("FORBIDDEN");
  return profile;
}

export async function requireParentProfile(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "parent") throw new Error("FORBIDDEN");
  return profile;
}

export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function strOrNull(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value === "" ? null : value;
}

export function numOrNull(formData: FormData, key: string): number | null {
  const value = str(formData, key).replace(",", ".");
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
