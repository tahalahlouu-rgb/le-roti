import { requireRole } from "@/lib/auth";
import { BottomNav, type NavItem } from "@/components/nav-links";
import { LogoutButton } from "@/components/shell";
import { t } from "@/lib/i18n";

const items: NavItem[] = [
  { href: "/parent", label: t.nav.home, icon: "home", exact: true },
  { href: "/parent/annonces", label: t.nav.announcements, icon: "megaphone" },
  { href: "/parent/messagerie", label: t.nav.messages, icon: "chat" },
];

// Espace parent : pensé mobile d'abord (barre d'onglets en bas)
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("parent");
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {profile.school.name}
            </p>
            <p className="text-xs leading-tight text-slate-500">
              {profile.first_name} {profile.last_name}
            </p>
          </div>
        </div>
        <LogoutButton />
      </header>
      <main className="px-4 py-5">{children}</main>
      <BottomNav items={items} />
    </div>
  );
}
