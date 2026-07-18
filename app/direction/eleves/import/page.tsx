"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import {
  importStudents,
  type CsvRow,
  type ImportReport,
} from "@/lib/actions/students";

// Découpe une ligne CSV en gérant les guillemets ("a;b";c)
function splitLine(line: string, sep: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const header = splitLine(lines[0], sep).map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
  const col = (names: string[]) =>
    header.findIndex((h) => names.includes(h));

  const iLast = col(["nom", "last_name"]);
  const iFirst = col(["prenom", "first_name"]);
  const iClass = col(["classe", "class"]);
  const iPhone = col(["telephone", "tel", "phone"]);
  const iParent = col(["email_parent", "parent_email", "parent"]);

  return lines.slice(1).map((line) => {
    const cells = splitLine(line, sep);
    const cell = (i: number) => (i >= 0 ? (cells[i] ?? "") : "");
    return {
      last_name: cell(iLast),
      first_name: cell(iFirst),
      class_name: cell(iClass),
      phone: cell(iPhone),
      parent_email: cell(iParent),
    };
  });
}

export default function ImportCsvPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setReport(null);
    setRows(parseCsv(await file.text()));
  }

  async function handleImport() {
    setBusy(true);
    try {
      setReport(await importStudents(rows));
      setRows([]);
    } catch {
      setReport({ imported: 0, warnings: [], error: t.common.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link
        href="/direction/eleves"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <PageHeader title={t.csv.title} />

      <div className="card max-w-3xl p-6">
        <p className="text-sm text-slate-600">{t.csv.intro}</p>
        <code className="mt-2 block w-fit rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-800">
          {t.csv.columns}
        </code>
        <p className="mt-2 text-xs text-slate-500">{t.csv.columnsHint}</p>

        <label className="btn-secondary mt-4 cursor-pointer">
          {t.csv.chooseFile}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </label>
        {fileName && (
          <span className="ml-3 text-sm text-slate-600">{fileName}</span>
        )}

        {report && (
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              {t.csv.doneTitle}
            </p>
            {report.error ? (
              <p className="mt-1 text-sm text-red-700">{report.error}</p>
            ) : (
              <p className="mt-1 text-sm text-emerald-700">
                {report.imported} {t.csv.imported}
              </p>
            )}
            {report.warnings.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-700">
                {report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold text-slate-900">
              {t.csv.preview} ({rows.length})
            </h2>
            <div className="mt-2 max-h-80 overflow-auto rounded-md border border-slate-200">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t.students.lastName}</th>
                    <th>{t.students.firstName}</th>
                    <th>{t.students.class}</th>
                    <th>{t.students.phone}</th>
                    <th>{t.students.parent}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.last_name}</td>
                      <td>{r.first_name}</td>
                      <td>{r.class_name}</td>
                      <td>{r.phone}</td>
                      <td>{r.parent_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleImport}
              disabled={busy}
              className="btn-primary mt-4"
            >
              {busy ? t.csv.importing : t.csv.import}
            </button>
          </>
        )}
      </div>
    </>
  );
}
