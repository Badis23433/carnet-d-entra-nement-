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
  exercise: string;
  entry_date: string; // YYYY-MM-DD
  weight: number;
  sets: number;
  reps: number;
  note: string | null;
  created_at: string;
};
