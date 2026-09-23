# Carnet d'entraînement

App mobile-first de suivi de séances (Next.js + Supabase). Trois onglets :

- **Séance** — choisis ton jour (Push / Pull / Legs) et remplis chaque
  exercice en un tap, avec ta dernière charge affichée comme repère.
  Un minuteur de repos se lance automatiquement après chaque série
  (60s à 3min selon l'exercice), avec vibration + bip sonore à la fin.
  Option "Autre exercice" pour tout ce qui est hors programme.
- **Progrès** — régularité (calendrier + série de semaines consécutives),
  poids de corps, graphique de charges par exercice (avec édition et
  suppression d'une entrée), objectifs avec barre de progression, et
  photos de progression datées.
- **Programme** — ton split complet + conseils nutrition, en référence.

Plusieurs profils sans mot de passe : au premier lancement, choisis ton nom
(ou crée-le) dans l'écran "Qui es-tu ?". Chaque profil a son propre
historique, ses objectifs et ses photos. Le profil actif est rappelé sur cet
appareil et peut être changé à tout moment via "Changer" en haut de chaque
page.

**Note iOS :** la vibration n'est pas disponible sur iPhone (Safari ne
supporte pas l'API de vibration — limitation d'Apple, pas du code). Le bip
sonore fonctionne mais peut être bloqué par endroits par les restrictions
audio d'iOS ; dans ce cas seul l'indicateur visuel du minuteur reste fiable.

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

### 1. Base (si pas déjà fait)

```sql
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  exercise text not null,
  entry_date date not null,
  weight numeric not null,
  sets integer not null,
  reps integer not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists entries_exercise_date_idx on entries (exercise, entry_date desc);

alter table exercises enable row level security;
alter table entries enable row level security;

create policy "anon full access exercises" on exercises
  for all using (true) with check (true);
create policy "anon full access entries" on entries
  for all using (true) with check (true);
```

### 2. Multi-profil et poids de corps (si pas déjà fait)

```sql
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "anon full access profiles" on profiles
  for all using (true) with check (true);

alter table entries add column if not exists user_id uuid references profiles(id) on delete cascade;
create index if not exists entries_user_idx on entries (user_id);
create index if not exists entries_user_exercise_date_idx on entries (user_id, exercise, entry_date desc);

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

### 3. Nouveau : objectifs et photos de progression

```sql
-- Objectifs
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  kind text not null default 'exercise' check (kind in ('exercise', 'body_weight')),
  target numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on goals (user_id);

alter table goals enable row level security;
create policy "anon full access goals" on goals
  for all using (true) with check (true);

-- Photos de progression (métadonnées ; les fichiers vont dans Storage)
create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_user_date_idx on progress_photos (user_id, entry_date desc);

alter table progress_photos enable row level security;
create policy "anon full access progress_photos" on progress_photos
  for all using (true) with check (true);

-- Bucket de stockage pour les photos (public en lecture, cohérent avec le
-- reste de l'app qui n'a pas d'authentification)
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do nothing;

create policy "anon read progress photos" on storage.objects
  for select using (bucket_id = 'progress-photos');
create policy "anon upload progress photos" on storage.objects
  for insert with check (bucket_id = 'progress-photos');
create policy "anon delete progress photos" on storage.objects
  for delete using (bucket_id = 'progress-photos');
```

**Important sur les photos :** le bucket est public et sans authentification,
comme le reste de l'app. Concrètement, toute personne qui aurait le lien
exact d'une photo pourrait l'ouvrir (le lien contient un identifiant
aléatoire, donc pas devinable, mais ce n'est pas un vrai contrôle d'accès).
Ne partage pas le lien de l'app publiquement, surtout avec cette
fonctionnalité activée.

**Anciennes entrées sans profil :** si tu avais des séances loguées avant la
mise en place du multi-profil, elles ont `user_id = NULL`. Pour les
rattacher à un profil, récupère son id dans Table Editor → `profiles`, puis :

```sql
update entries set user_id = '<id-de-ton-profil>' where user_id is null;
```

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase JS (base de
données + stockage) · Recharts
