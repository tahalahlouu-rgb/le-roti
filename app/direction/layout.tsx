import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import type { NavItem } from "@/components/nav-links";
import { t } from "@/lib/i18n";

const items: NavItem[] = [
  { href: "/direction", label: t.nav.dashboard, icon: "home", exact: true },
  { href: "/direction/eleves", label: t.nav.students, icon: "users" },
  { href: "/direction/classes", label: t.nav.classes, icon: "layers" },
  { href: "/direction/absences", label: t.nav.attendance, icon: "calendarX" },
  { href: "/direction/paiements", label: t.nav.payments, icon: "banknote" },
  { href: "/direction/annonces", label: t.nav.announcements, icon: "megaphone" },
  { href: "/direction/messagerie", label: t.nav.messages, icon: "chat" },
  { href: "/direction/equipe", label: t.nav.team, icon: "idCard" },
  { href: "/direction/parametres", label: t.nav.settings, icon: "sliders" },
];

export default async function DirectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");
  return (
    <AppShell profile={profile} items={items}>
      {children}
    </AppShell>
  );
}
