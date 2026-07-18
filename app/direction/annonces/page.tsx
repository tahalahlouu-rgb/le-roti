import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDateLong } from "@/lib/format";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import {
  saveAnnouncement,
  deleteAnnouncement,
  togglePinned,
} from "@/lib/actions/communication";
import type { Announcement } from "@/lib/types";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  const announcements = (data ?? []) as Announcement[];

  return (
    <>
      <PageHeader title={t.announcements.title} />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            {t.announcements.newAnnouncement}
          </h2>
          <ActionForm action={saveAnnouncement}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.announcements.announcementTitle} *
            </label>
            <input name="title" required className="input mb-3" />
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.announcements.body} *
            </label>
            <textarea name="body" required rows={5} className="input mb-3" />
            <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="pinned"
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              {t.announcements.pinned}
            </label>
            <SubmitButton>{t.announcements.publish}</SubmitButton>
          </ActionForm>
        </section>

        <section className="space-y-3 lg:col-span-3">
          {announcements.length === 0 ? (
            <EmptyState message={t.announcements.none} />
          ) : (
            announcements.map((a) => (
              <article key={a.id} className="card p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {a.title}{" "}
                    {a.pinned && (
                      <Badge tone="amber">{t.announcements.pinned}</Badge>
                    )}
                  </h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <ActionForm action={togglePinned} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        type="hidden"
                        name="pinned"
                        value={a.pinned ? "false" : "true"}
                      />
                      <SubmitButton className="text-xs font-medium text-slate-500 hover:text-slate-700">
                        {a.pinned ? t.announcements.unpin : t.announcements.pin}
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteAnnouncement} className="inline">
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmButton className="text-xs text-red-600 hover:underline">
                        {t.common.delete}
                      </ConfirmButton>
                    </ActionForm>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDateLong(a.published_at)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {a.body}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </>
  );
}
