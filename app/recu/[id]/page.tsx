import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { formatDateLong, formatMAD, formatMonth } from "@/lib/format";
import { PrintToolbar } from "@/components/print-toolbar";
import type { PaymentMethod } from "@/lib/types";

interface ReceiptRow {
  id: string;
  month: string;
  amount: number;
  paid_at: string | null;
  method: PaymentMethod | null;
  receipt_number: string | null;
  student: {
    first_name: string;
    last_name: string;
    class: { name: string } | null;
    parent: { first_name: string; last_name: string } | null;
  } | null;
}

const methodLabel: Record<PaymentMethod, string> = {
  cash: t.payments.cash,
  cheque: t.payments.cheque,
  transfer: t.payments.transfer,
};

// Reçu imprimable (A5 dans une page A4). Accessible à la direction
// et au parent de l'élève (RLS).
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) redirect("/connexion");
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select(
      "id, month, amount, paid_at, method, receipt_number, student:students(first_name, last_name, class:classes(name), parent:profiles(first_name, last_name))"
    )
    .eq("id", id)
    .eq("status", "paid")
    .single();
  if (!data) notFound();
  const payment = data as unknown as ReceiptRow;
  const school = profile.school;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <PrintToolbar />

      <div className="card print-sheet p-8">
        <header className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <p className="text-lg font-bold text-slate-900">{school.name}</p>
            {school.address && (
              <p className="text-sm text-slate-600">{school.address}</p>
            )}
            {school.phone && (
              <p className="text-sm text-slate-600">{school.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase text-slate-900">
              {t.payments.receiptTitle}
            </p>
            <p className="text-sm font-medium text-slate-700">
              {payment.receipt_number}
            </p>
          </div>
        </header>

        <dl className="mt-6 space-y-3 text-sm">
          {payment.student?.parent && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">{t.payments.receivedFrom}</dt>
              <dd className="font-medium text-slate-900">
                {payment.student.parent.first_name}{" "}
                {payment.student.parent.last_name}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">{t.payments.forStudent}</dt>
            <dd className="font-medium text-slate-900">
              {payment.student?.first_name} {payment.student?.last_name}
              {payment.student?.class ? ` (${payment.student.class.name})` : ""}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">{t.payments.forMonth}</dt>
            <dd className="font-medium capitalize text-slate-900">
              {formatMonth(payment.month)}
            </dd>
          </div>
          {payment.method && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">{t.payments.method}</dt>
              <dd className="font-medium text-slate-900">
                {methodLabel[payment.method]}
              </dd>
            </div>
          )}
          {payment.paid_at && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">{t.payments.paidOn}</dt>
              <dd className="font-medium text-slate-900">
                {formatDateLong(payment.paid_at)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-center justify-between rounded-md bg-slate-900 px-5 py-4 text-white print:border print:border-slate-900 print:bg-white print:text-slate-900">
          <span className="text-sm font-medium">{t.payments.amount}</span>
          <span className="text-2xl font-bold">
            {formatMAD(Number(payment.amount))}
          </span>
        </div>

        <div className="mt-10 flex justify-end">
          <div className="text-center">
            <p className="mb-16 text-sm font-medium text-slate-700">
              {t.payments.stamp}
            </p>
            <div className="w-44 border-t border-slate-400"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
