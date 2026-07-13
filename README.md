# Le Rotî — Site officiel

**« Bien plus que du poulet »** — Rôtisserie au Food Court de Ryad Square, Rabat.

Site vitrine premium : ouverture cinématographique au scroll (feu, braises,
rôtissoire), carte complète avec les vraies photos des plats, expérience de
localisation « Voyage vers Le Rotî », section Instagram et commande directe
sur Glovo.

## Stack

- [Vite](https://vitejs.dev) + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- [motion](https://motion.dev) (animations liées au scroll)
- `lucide-react` (icônes), polices auto-hébergées via Fontsource
  (Cormorant Garamond + Plus Jakarta Sans)

Aucune API externe, aucune clé requise. Les seuls liens sortants sont les
liens officiels Glovo, Google Maps et Instagram, centralisés dans
[`src/data/restaurant.ts`](src/data/restaurant.ts).

## Prévisualiser en local

```bash
npm install
npm run dev        # http://localhost:5173
```

Build de production et prévisualisation du build :

```bash
npm run lint       # vérification TypeScript
npm run build      # génère dist/
npm run preview    # sert dist/ en local
```

## Déployer sur Vercel

Le projet est un site statique Vite standard, détecté automatiquement :

1. Pousser la branche sur GitHub.
2. Dans Vercel : **Add New → Project**, importer ce dépôt.
3. Framework preset : **Vite** (détecté automatiquement) —
   build `npm run build`, output `dist/`. Aucune variable d'environnement.
4. Déployer. Le routage étant en hash (`/#/menu`, `/#/contact`),
   l'ouverture directe de n'importe quelle route fonctionne sans rewrite.

Pour mettre à jour le site existant `le-roti.vercel.app`, il suffit de faire
pointer le projet Vercel correspondant vers ce dépôt/cette branche.

## Structure

```
public/images/menu/   58 photos produit WebP (615×615)
src/components/       héros cinématographique, scène rôtissoire, braises canvas,
                      voyage vers Le Rotî (SVG), cartes menu, CTA Glovo…
src/data/menu.ts      la carte (noms, prix, descriptions, photos)
src/data/restaurant.ts  coordonnées, horaires et liens officiels
src/pages/            Accueil, Menu, Nous Trouver, 404
```

## Données commerciales

Les prix, noms et descriptions proviennent de la carte existante du dépôt et
ne doivent être modifiés qu'avec une source officielle (Glovo / restaurant).
Trois produits n'ont pas encore de photo dédiée : Club Sandwich Complet,
Jus d'Orange Frais, Tiramisu Maison (cartes texte élégantes en attendant).

## Accessibilité & performance

- `prefers-reduced-motion` respecté partout (compositions statiques) ;
- navigation clavier complète, focus visibles, aria-labels ;
- images lazy avec dimensions intrinsèques (zéro layout shift) et
  fallback maison en cas d'erreur réseau ;
- animations canvas coupées hors écran et hors onglet, densité réduite
  sur mobile ; aucune bibliothèque 3D lourde.
