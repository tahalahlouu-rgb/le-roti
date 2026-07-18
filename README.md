# Madrasati — Gestion scolaire pour écoles privées marocaines

SaaS de gestion scolaire (v1) destiné aux directions d'écoles privées : élèves & classes, notes & bulletins, absences & retards, suivi des paiements en MAD, annonces et messagerie parents. Interface 100 % en français (structure i18n prête pour l'arabe et le RTL), pensée mobile-first côté parents.

**Stack** : Next.js (App Router) + TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind CSS · déploiement Vercel.

## Rôles

| Rôle | Accès |
|---|---|
| **Direction** (`admin`) | Tout : élèves, classes, paiements, absences, annonces, messagerie, comptes |
| **Enseignant** (`teacher`) | Ses classes uniquement : saisie des notes et des absences |
| **Parent** (`parent`) | Lecture seule sur ses enfants : notes, absences, paiements, annonces + messagerie avec la direction |

La sécurité est appliquée **en base** par Row Level Security (voir [`docs/SCHEMA.md`](docs/SCHEMA.md)) — pas seulement dans l'interface.

## Prérequis

- Node.js 20 ou plus récent
- Un projet [Supabase](https://supabase.com) (le plan gratuit suffit)
- npm

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner depuis le tableau de bord Supabase (**Settings → API**) :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet (https://xxxx.supabase.co) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique `anon` (protégée par le RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé `service_role` — **secrète, serveur uniquement** (création de comptes, seed) |

## Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Ouvrir **SQL Editor** et exécuter, dans l'ordre, le contenu de :
   1. `supabase/migrations/0001_schema.sql` — tables, enums, index
   2. `supabase/migrations/0002_rls.sql` — fonctions + politiques RLS
   3. `supabase/migrations/0003_profiles_email.sql`
   4. `supabase/migrations/0004_class_stats.sql` — stats de classe (bulletins)
3. Dans **Authentication → Providers**, vérifier que **Email** est activé. Aucune inscription publique n'est utilisée : tous les comptes sont créés par la direction (ou par le seed).

> Alternative : `supabase db push` avec la [CLI Supabase](https://supabase.com/docs/guides/cli) si vous préférez appliquer le dossier `supabase/migrations` automatiquement.

## Lancement local

```bash
npm install
npm run seed   # école de démonstration (voir ci-dessous)
npm run dev    # http://localhost:3000
```

### Données de démonstration

`npm run seed` crée le **Groupe Scolaire Al Amal** (Casablanca) : 3 classes (CP-A, CE1-A, CE2-A), 30 élèves marocains fictifs avec leurs parents, 4 enseignants, une année complète de notes, d'absences et de mensualités (payées/impayées). Le script s'adapte à la date du jour et il est ré-exécutable (il supprime et recrée la démo).

| Compte | E-mail | Mot de passe |
|---|---|---|
| Direction | `admin@demo.ma` | `demo1234` |
| Enseignant | `enseignant@demo.ma` | `demo1234` |
| Parent (2 enfants) | `parent@demo.ma` | `demo1234` |

Tous les autres comptes générés (`parent1@demo.ma`, `amina.tazi@demo.ma`, …) utilisent le même mot de passe.

## Déploiement Vercel

1. Pousser le dépôt sur GitHub et l'importer dans [Vercel](https://vercel.com) (framework détecté : Next.js, aucune configuration particulière).
2. Renseigner les trois variables d'environnement ci-dessus dans **Project → Settings → Environment Variables**.
3. Déployer. Les migrations doivent avoir été appliquées au projet Supabase au préalable ; le seed se lance depuis votre machine (`npm run seed` avec le `.env.local` pointant vers le projet de production… ou de démo).

## Fonctionnalités v1

- **Élèves & classes** — CRUD élèves (classe, parent lié, téléphone, tarif spécifique), niveaux avec mensualité par défaut, classes, **import CSV** (`nom;prenom;classe;telephone;email_parent`) avec aperçu et rapport.
- **Notes** — saisie par contrôle (note/20, coefficient) pour toute la classe, moyennes automatiques par matière et générale, **bulletin trimestriel imprimable** (moyennes de classe, rang, print CSS A4).
- **Absences & retards** — appel rapide par classe (présent/absence/retard), justification côté direction, compteurs par élève et par mois, visibles côté parent.
- **Paiements** (pas de paiement en ligne) — génération des mensualités du mois, encaissement manuel (espèces/chèque/virement), **reçu imprimable numéroté**, liste filtrable des impayés, totaux encaissé/attendu par mois.
- **Communication** — annonces de la direction (épinglables) visibles par les parents, messagerie parent ↔ direction avec accusés de lecture.
- **Tableau de bord** — effectif, impayés et encaissé du mois, absences du jour, dernières annonces, messages non lus.

Hors scope v1 : emploi du temps, paie, comptabilité, paiement en ligne, export Massar, visioconférence, application mobile native.

## Structure du code

```
app/
  connexion/            # login (e-mail / mot de passe)
  direction/            # espace admin (sidebar) : dashboard, élèves,
                        # classes, absences, paiements, annonces,
                        # messagerie, équipe & comptes, paramètres
  enseignant/           # espace enseignant : ses classes → notes, appel
  parent/               # espace parent (mobile-first, barre d'onglets)
  bulletin/[id]/        # bulletin imprimable (direction + parent)
  recu/[id]/            # reçu de paiement imprimable
components/             # UI partagée (formulaires, navigation, icônes…)
lib/
  actions/              # actions serveur par domaine (mutations)
  i18n/                 # dictionnaire fr (structure prête pour l'arabe)
  supabase/             # clients navigateur / serveur / service role
scripts/seed.mjs        # démo commerciale
supabase/migrations/    # schéma SQL + RLS
docs/SCHEMA.md          # documentation du schéma et matrice RBAC
proxy.ts                # rafraîchissement de session + garde d'accès
```

## Ajouter l'arabe plus tard

Le dictionnaire vit dans `lib/i18n/dictionaries/fr.ts`. Créer `ar.ts` avec les mêmes clés, déclarer la locale (`dir: "rtl"`) dans `lib/i18n/index.ts`, et brancher la sélection de langue dans `getLocale()` — le `<html>` reçoit déjà `lang` et `dir` depuis cette configuration.
