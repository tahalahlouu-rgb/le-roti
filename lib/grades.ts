// Calcul des moyennes (notes sur 20, pondérées par coefficient).
// Les moyennes ne sont jamais stockées : toujours recalculées.

export interface GradeLike {
  subject_id: string;
  score: number;
  coefficient: number;
}

/** Moyenne pondérée par matière : Σ(note×coef) / Σcoef */
export function subjectAverages(grades: GradeLike[]): Map<string, number> {
  const sums = new Map<string, { weighted: number; coefs: number }>();
  for (const g of grades) {
    const entry = sums.get(g.subject_id) ?? { weighted: 0, coefs: 0 };
    entry.weighted += Number(g.score) * Number(g.coefficient);
    entry.coefs += Number(g.coefficient);
    sums.set(g.subject_id, entry);
  }
  const averages = new Map<string, number>();
  for (const [subjectId, { weighted, coefs }] of sums) {
    if (coefs > 0) averages.set(subjectId, weighted / coefs);
  }
  return averages;
}

/** Moyenne générale : moyenne simple des moyennes par matière */
export function generalAverage(subjectAvgs: Iterable<number>): number | null {
  let sum = 0;
  let count = 0;
  for (const avg of subjectAvgs) {
    sum += avg;
    count++;
  }
  return count === 0 ? null : sum / count;
}

/** Trimestre courant (dates), sinon le dernier commencé, sinon le premier */
export function pickCurrentTerm<
  T extends { start_date: string; end_date: string },
>(terms: T[]): T | undefined {
  if (terms.length === 0) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  return (
    terms.find((t) => t.start_date <= today && today <= t.end_date) ??
    [...terms].reverse().find((t) => t.start_date <= today) ??
    terms[0]
  );
}

// Statistiques de classe renvoyées par la fonction SQL class_term_stats
export interface ClassTermStats {
  subjects: { subject_id: string; class_avg: number }[];
  students: { student_id: string; general_avg: number }[];
}
