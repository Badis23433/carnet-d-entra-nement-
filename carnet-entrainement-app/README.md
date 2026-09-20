# Carnet d'entraînement

App mobile-first de suivi de séances (Next.js + Supabase), connectée à ta
base Supabase réelle. Deux onglets : **Séances** (log + historique par
exercice) et **Programme** (ton split Push/Pull/Legs + conseils nutrition).

## Démarrer en local

```bash
npm install
npm run dev
```

`.env.local` contient déjà les clés de ton projet Supabase (`carnet-entrainement`,
région eu-west-3) — pas besoin de les retaper. Ce fichier est ignoré par git,
il ne sera pas poussé sur GitHub.

## Déployer sur Vercel

1. Pousse ce dossier sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), "Add New Project" → importe le dépôt.
   Next.js est détecté automatiquement, aucune config nécessaire.
3. Dans **Settings → Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ornyjoxjduuuegeskhwx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (la clé `sb_publishable_...` de `.env.local`)
4. Déploie.

## Base de données

Le projet Supabase `carnet-entrainement` contient déjà les tables :
- `entries` : chaque ligne = une charge travaillée un jour donné
- `exercises` : les exercices ajoutés en plus de la liste par défaut

Pas d'authentification : la clé publique a accès complet en lecture/écriture
(RLS ouvert), comme demandé pour un usage perso. Le lien de l'app reste donc
à ne pas partager publiquement si tu veux garder tes données privées.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase JS
