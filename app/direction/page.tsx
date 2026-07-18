import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import {
  currentMonthISO,
  formatDateLong,
  formatMAD,
  formatMonth,
  todayISO,
} from "@/lib/format";
import { PageHeader, StatCard, Badge } from "@/components/ui";
import type { Announcement } from "@/lib/types";

// Tableau de bord direction : impayés du mois, absences du jour,
// effectif total, dernières annonces.
export default async function DashboardPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const today = todayISO();

  // Mois courant, ou dernier mois facturé s'il n'y a rien ce mois-ci
  // (vacances d'été par exemple)
  let monthStart = currentMonthISO();
  const { count: currentMonthCount } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("month", monthStart);
  if (!currentMonthCount) {
    const { data: latest } = await supabase
      .from("payments")
      .select("month")
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.month) monthStart = latest.month;
  }

  const [
    { count: studentCount },
    { data: monthPayments },
    { data: todayAttendance },
    { data: announcementsData },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("payments")
      .select("amount, status")
      .eq("month", monthStart),
    supabase.from("attendance").select("type").eq("date", today),
    supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", profile.id),
  ]);

  const unpaid = (monthPayments ?? []).filter((p) => p.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, p) => sum + Number(p.amount), 0);
  const collectedTotal = (monthPayments ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const absencesToday = (todayAttendance ?? []).filter(
    (a) => a.type === "absence"
  ).length;
  const latesToday = (todayAttendance ?? []).filter(
    (a) => a.type === "late"
  ).length;
  const announcements = (announcementsData ?? []) as Announcement[];

  return (
    <>
      <PageHeader
        title={t.dashboard.title}
        subtitle={`${profile.school.name} · ${formatMonth(monthStart)}`}
      />

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/direction/eleves">
          <StatCard
            label={t.dashboard.totalStudents}
            value={String(studentCount ?? 0)}
            hint={t.dashboard.activeStudents}
          />
        </Link>
        <Link href="/direction/paiements?statut=unpaid">
          <StatCard
            label={t.dashboard.unpaidThisMonth}
            value={formatMAD(unpaidTotal)}
            hint={`${unpaid.length} ${t.payments.unpaid.toLowerCase()}${unpaid.length > 1 ? "s" : ""}`}
            tone={unpaidTotal > 0 ? "red" : "green"}
          />
        </Link>
        <Link href="/direction/paiements">
          <StatCard
            label={t.dashboard.collectedThisMonth}
            value={formatMAD(collectedTotal)}
            tone="green"
          />
        </Link>
        <Link href="/direction/absences">
          <StatCard
            label={t.dashboard.absencesToday}
            value={String(absencesToday)}
            hint={`${latesToday} ${t.dashboard.latesToday}`}
            tone={absencesToday > 0 ? "amber" : "slate"}
          />
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              {t.dashboard.latestAnnouncements}
            </h2>
            <Link
              href="/direction/annonces"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              {t.dashboard.seeAll} →
            </Link>
          </div>
          {announcements.length === 0 ? (
            <div className="card p-4 text-sm text-slate-500">
              {t.announcements.none}
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <article key={a.id} className="card p-4">
                  <h3 className="font-medium text-slate-900">
                    {a.title}{" "}
                    {a.pinned && (
                      <Badge tone="amber">{t.announcements.pinned}</Badge>
                    )}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateLong(a.published_at)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                    {a.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {t.messaging.title}
          </h2>
          <Link href="/direction/messagerie" className="card block p-4">
            <p className="text-sm text-slate-500">
              {t.dashboard.unreadMessages}
            </p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                (unreadCount ?? 0) > 0 ? "text-emerald-700" : "text-slate-900"
              }`}
            >
              {unreadCount ?? 0}
            </p>
          </Link>
        </section>
      </div>
    </>
  );
}
