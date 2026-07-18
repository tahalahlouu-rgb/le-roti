import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDateLong } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui";
import type { Announcement } from "@/lib/types";

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  const announcements = (data ?? []) as Announcement[];

  return (
    <>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        {t.announcements.title}
      </h1>
      {announcements.length === 0 ? (
        <EmptyState message={t.announcements.none} />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article key={a.id} className="card p-4">
              <h2 className="font-semibold text-slate-900">
                {a.title}{" "}
                {a.pinned && (
                  <Badge tone="amber">{t.announcements.pinned}</Badge>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateLong(a.published_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {a.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
