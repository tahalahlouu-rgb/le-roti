import { fr } from "./dictionaries/fr";

export type Locale = "fr"; // ajouter "ar" ici le moment venu

type LocaleMeta = {
  lang: string;
  dir: "ltr" | "rtl";
  dict: typeof fr;
};

export const locales: Record<Locale, LocaleMeta> = {
  fr: { lang: "fr", dir: "ltr", dict: fr },
};

export const defaultLocale: Locale = "fr";

export function getLocale(): LocaleMeta {
  // v1 : locale unique. Brancher ici la détection (cookie, profil…)
  // quand l'arabe sera ajouté.
  return locales[defaultLocale];
}

// Raccourci utilisé dans toute l'application : t.nav.students, etc.
export const t = getLocale().dict;
