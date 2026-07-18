import { PageHeader } from "@/components/ui";
import { t } from "@/lib/i18n";

// Espace enseignant — sera enrichi par les modules 2 et 3
export default function TeacherHomePage() {
  return (
    <>
      <PageHeader title={t.nav.myClasses} />
      <p className="text-sm text-slate-500">{t.common.empty}</p>
    </>
  );
}
