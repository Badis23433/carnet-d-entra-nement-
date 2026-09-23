import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  // En dev, vérifie ton fichier .env.local. En prod, vérifie les variables
  // d'environnement du projet Vercel.
  console.warn("Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Entry = {
  id: string;
  user_id: string;
  exercise: string;
  entry_date: string; // YYYY-MM-DD
  weight: number;
  sets: number;
  reps: number;
  note: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  created_at: string;
};

export type BodyWeightEntry = {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  weight: number;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  label: string; // nom de l'exercice, ou "Poids de corps"
  kind: "exercise" | "body_weight";
  target: number;
  created_at: string;
};

export type ProgressPhoto = {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  storage_path: string;
  note: string | null;
  created_at: string;
};

export const PHOTOS_BUCKET = "progress-photos";
