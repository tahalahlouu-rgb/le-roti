import { redirect } from "next/navigation";
import { getSessionProfile, roleHome } from "@/lib/auth";

export default async function Home() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/connexion");
  redirect(roleHome(profile.role));
}
