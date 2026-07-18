import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import type { NavItem } from "@/components/nav-links";
import { t } from "@/lib/i18n";

const items: NavItem[] = [
  { href: "/enseignant", label: t.nav.myClasses, icon: "cap" },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");
  return (
    <AppShell profile={profile} items={items}>
      {children}
    </AppShell>
  );
}
