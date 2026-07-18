import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatMAD, formatMonth } from "@/lib/format";
import { PageHeader, Badge, EmptyState, StatCard } from "@/components/ui";
import { ActionForm, SubmitButton, ConfirmButton } from "@/components/forms";
import {
  generateMonth,
  markPaid,
  markUnpaid,
  deletePayment,
} from "@/lib/actions/payments";
import type { PaymentStatus } from "@/lib/types";

interface PaymentRow {
  id: string;
  amount: number;
  status: PaymentStatus;
  receipt_number: string | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class: { id: string; name: string } | null;
  } | null;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; statut?: string; classe?: string }>;
}) {
  const { mois, statut = "", classe = "" } = await searchParams;
  const supabase = await createClient();

  const month = /^\d{4}-\d{2}$/.test(mois ?? "")
    ? mois!
    : new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01`;

  const [{ data: paymentsData }, { data: classes }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, amount, status, receipt_number, student:students(id, first_name, last_name, class:classes(id, name))"
      )
      .eq("month", monthStart),
    supabase.from("classes").select("id, name").order("name"),
  ]);
  let payments = (paymentsData ?? []) as unknown as PaymentRow[];
  payments.sort((a, b) =>
    `${a.student?.last_name} ${a.student?.first_name}`.localeCompare(
      `${b.student?.last_name} ${b.student?.first_name}`
    )
  );

  const expected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const collected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const unpaidCount = payments.filter((p) => p.status === "unpaid").length;

  if (statut === "unpaid") payments = payments.filter((p) => p.status === "unpaid");
  if (statut === "paid") payments = payments.filter((p) => p.status === "paid");
  if (classe) payments = payments.filter((p) => p.student?.class?.id === classe);

  return (
    <>
      <PageHeader
        title={t.payments.title}
        subtitle={formatMonth(monthStart)}
        actions={
          <ActionForm action={generateMonth}>
            <input type="hidden" name="month" value={month} />
            <SubmitButton className="btn-secondary" >
              {t.payments.generate}
            </SubmitButton>
          </ActionForm>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t.payments.expected} value={formatMAD(expected)} />
        <StatCard
          label={t.payments.collected}
          value={formatMAD(collected)}
          tone="green"
        />
        <StatCard
          label={t.payments.outstanding}
          value={formatMAD(expected - collected)}
          hint={`${unpaidCount} ${t.payments.unpaid.toLowerCase()}${unpaidCount > 1 ? "s" : ""}`}
          tone={expected - collected > 0 ? "red" : "slate"}
        />
      </div>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          type="month"
          name="mois"
          defaultValue={month}
          className="input w-40"
        />
        <select name="statut" defaultValue={statut} className="input w-52">
          <option value="">{t.payments.allStatuses}</option>
          <option value="unpaid">{t.payments.unpaidOnly}</option>
          <option value="paid">{t.payments.paid}</option>
        </select>
        <select name="classe" defaultValue={classe} className="input w-44">
          <option value="">{t.students.allClasses}</option>
          {(classes ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          {t.common.filter}
        </button>
      </form>

      {payments.length === 0 ? (
        <EmptyState message={t.common.empty} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t.students.title}</th>
                <th>{t.students.class}</th>
                <th className="text-right">{t.payments.amount}</th>
                <th>{t.common.status}</th>
                <th className="text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">
                    {p.student ? (
                      <Link
                        href={`/direction/eleves/${p.student.id}`}
                        className="hover:underline"
                      >
                        {p.student.last_name} {p.student.first_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{p.student?.class?.name ?? "—"}</td>
                  <td className="text-right font-medium">
                    {formatMAD(Number(p.amount))}
                  </td>
                  <td>
                    {p.status === "paid" ? (
                      <Badge tone="green">
                        {t.payments.paid}
                        {p.receipt_number ? ` · ${p.receipt_number}` : ""}
                      </Badge>
                    ) : (
                      <Badge tone="red">{t.payments.unpaid}</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {p.status === "unpaid" ? (
                        <>
                          <ActionForm
                            action={markPaid}
                            className="flex items-center gap-1.5"
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <select
                              name="method"
                              className="input w-28 py-1 text-xs"
                              defaultValue="cash"
                            >
                              <option value="cash">{t.payments.cash}</option>
                              <option value="cheque">{t.payments.cheque}</option>
                              <option value="transfer">
                                {t.payments.transfer}
                              </option>
                            </select>
                            <SubmitButton className="btn-primary px-2.5 py-1 text-xs">
                              {t.payments.collect}
                            </SubmitButton>
                          </ActionForm>
                          <ActionForm action={deletePayment} className="inline">
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton className="text-xs text-slate-400 hover:text-red-600">
                              ✕
                            </ConfirmButton>
                          </ActionForm>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/recu/${p.id}`}
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            {t.payments.receipt} →
                          </Link>
                          <ActionForm action={markUnpaid} className="inline">
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton
                              className="text-xs text-slate-400 hover:text-red-600"
                              message={t.payments.cancelConfirm}
                            >
                              {t.payments.cancelPayment}
                            </ConfirmButton>
                          </ActionForm>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">{t.payments.generateHint}</p>
    </>
  );
}
