import { PageHeader } from "@/components/ui";
import { t } from "@/lib/i18n";

// Tableau de bord — sera enrichi par le module 6
export default function DashboardPage() {
  return (
    <>
      <PageHeader title={t.nav.dashboard} />
      <p className="text-sm text-slate-500">{t.common.empty}</p>
    </>
  );
}
