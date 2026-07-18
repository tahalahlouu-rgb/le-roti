import { t } from "@/lib/i18n";
import type { SessionProfile } from "@/lib/auth";
import { Icon } from "./icons";
import { SideNav, TopNav, type NavItem } from "./nav-links";

// Coquille commune direction / enseignant : barre latérale sur desktop,
// barre horizontale sur mobile.
export function AppShell({
  profile,
  items,
  children,
}: {
  profile: SessionProfile;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Barre latérale desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {profile.school.name}
            </p>
            <p className="text-xs text-slate-500">{t.roles[profile.role]}</p>
          </div>
        </div>
        <SideNav items={items} />
        <UserFooter profile={profile} />
      </aside>

      {/* Barre supérieure mobile */}
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              M
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {profile.school.name}
            </p>
          </div>
          <LogoutButton />
        </div>
        <TopNav items={items} />
      </header>

      <main className="px-4 py-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function UserFooter({ profile }: { profile: SessionProfile }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {profile.first_name} {profile.last_name}
        </p>
        <p className="text-xs text-slate-500">{t.roles[profile.role]}</p>
      </div>
      <LogoutButton />
    </div>
  );
}

export function LogoutButton() {
  return (
    <form action="/deconnexion" method="post">
      <button
        type="submit"
        title={t.auth.logout}
        className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
      >
        <Icon name="logout" className="h-5 w-5" />
      </button>
    </form>
  );
}
