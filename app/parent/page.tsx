import { PageHeader } from "@/components/ui";
import { t } from "@/lib/i18n";

// Accueil parent — sera enrichi par les modules 2, 3 et 4
export default function ParentHomePage() {
  return (
    <>
      <PageHeader title={t.nav.home} />
      <p className="text-sm text-slate-500">{t.common.empty}</p>
    </>
  );
}
