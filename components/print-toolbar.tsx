"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { Icon } from "./icons";

// Barre d'outils des pages imprimables (bulletin, reçu) — masquée
// à l'impression.
export function PrintToolbar() {
  const router = useRouter();
  return (
    <div className="no-print mb-6 flex items-center justify-between">
      <button onClick={() => router.back()} className="btn-secondary">
        ← {t.common.back}
      </button>
      <button onClick={() => window.print()} className="btn-primary">
        <Icon name="printer" className="h-4 w-4" />
        {t.common.print}
      </button>
    </div>
  );
}
