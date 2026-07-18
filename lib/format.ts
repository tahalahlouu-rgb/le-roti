// Formats fr-MA : montants en MAD, dates locales

const mad = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateShort = new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" });
const dateLong = new Intl.DateTimeFormat("fr-MA", { dateStyle: "long" });
const monthYear = new Intl.DateTimeFormat("fr-MA", {
  month: "long",
  year: "numeric",
});

export function formatMAD(amount: number): string {
  return mad.format(amount);
}

export function formatDate(iso: string | Date): string {
  return dateShort.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDateLong(iso: string | Date): string {
  return dateLong.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** "2025-09-01" → "septembre 2025" */
export function formatMonth(isoMonth: string): string {
  return monthYear.format(new Date(isoMonth));
}

/** Date du jour au format ISO (YYYY-MM-DD) */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 1er du mois courant au format ISO */
export function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 8) + "01";
}

/** Note sur 20 : 14.5 → "14,50" */
export function formatScore(score: number): string {
  return score.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
