"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_EXERCISES } from "@/lib/data";

export function useExercises() {
  const [custom, setCustom] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("exercises")
      .select("name")
      .order("created_at");
    const names = (data ?? [])
      .map((r: { name: string }) => r.name)
      .filter((n) => !DEFAULT_EXERCISES.includes(n));
    setCustom(names);
    setLoading(false);
  }

  async function addExercise(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (all.includes(trimmed)) return trimmed;
    const { error } = await supabase.from("exercises").insert({ name: trimmed });
    if (error) return null;
    setCustom((prev) => [...prev, trimmed]);
    return trimmed;
  }

  const all = useMemo(() => [...DEFAULT_EXERCISES, ...custom], [custom]);

  return { all, custom, loading, addExercise };
}
