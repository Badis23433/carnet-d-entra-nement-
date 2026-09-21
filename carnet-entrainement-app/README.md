# Carnet d'entraînement

App mobile-first de suivi de séances (Next.js + Supabase). Trois onglets :

- **Séance** — choisis ton jour (Push / Pull / Legs) et remplis chaque
  exercice en un tap, avec ta dernière charge affichée comme repère. Option
  "Autre exercice" pour tout ce qui est hors programme (callisthénie, etc.).
- **Progrès** — suivi du poids de corps avec graphique d'évolution, et
  graphique de progression des charges par exercice.
- **Programme** — ton split complet + conseils nutrition, en référence.

Plusieurs profils sans mot de passe : au premier lancement, choisis ton nom
(ou crée-le) dans l'écran "Qui es-tu ?". Chaque profil a son propre
historique. Le profil actif est rappelé sur cet appareil et peut être changé
à tout moment via "Changer" en haut de chaque page.

## Démarrer en local

```bash
npm install
npm run dev
```

`.env.local` contient tes clés Supabase. Ce fichier est ignoré par git.

## Déployer sur Vercel

1. Pousse ce dossier sur un dépôt GitHub (à la racine du dépôt, pas dans un
   sous-dossier — sinon règle "Root Directory" dans Settings → Build and
   Deployment).
2. Importe le dépôt sur [vercel.com](https://vercel.com). Framework Preset :
   **Next.js**.
3. Dans **Settings → Environment Variables**, ajoute pour Production, Preview
   et Development :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déploie.

## Base de données — SQL à exécuter

Si tu avais déjà les tables `entries` et `exercises` d'une version
précédente, exécute ce script dans le **SQL Editor** de Supabase pour
ajouter le multi-profil et le poids de corps (sans rien casser) :

```sql
-- Profils (multi-utilisateur simple, sans mot de passe)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "anon full access profiles" on profiles
  for all using (true) with check (true);

-- Rattacher les séances à un profil
alter table entries add column if not exists user_id uuid references profiles(id) on delete cascade;
create index if not exists entries_user_idx on entries (user_id);
create index if not exists entries_user_exercise_date_idx on entries (user_id, exercise, entry_date desc);

-- Suivi du poids de corps
create table if not exists body_weight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  weight numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists body_weight_user_date_idx on body_weight (user_id, entry_date desc);

alter table body_weight enable row level security;
create policy "anon full access body_weight" on body_weight
  for all using (true) with check (true);
```

Si tu démarres d'une base neuve, exécute d'abord le script complet original
(tables `entries` et `exercises`) puis celui ci-dessus.

**Note sur les anciennes entrées :** si tu avais déjà des séances loggées
avant cette mise à jour, elles ont `user_id = NULL` et ne s'afficheront sous
aucun profil. Pour les rattacher à ton premier profil créé, récupère son id
dans Table Editor → `profiles`, puis exécute :

```sql
update entries set user_id = '<id-de-ton-profil>' where user_id is null;
```

Pas d'authentification : la clé publique a accès complet en lecture/écriture
(RLS ouvert), comme demandé pour un usage perso. Ne partage pas le lien de
l'app publiquement.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase JS · Recharts
