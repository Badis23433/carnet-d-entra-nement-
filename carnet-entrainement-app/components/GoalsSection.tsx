"use client";

import { useEffect, useState } from "react";
import { supabase, Goal } from "@/lib/supabase";
import { useExercises } from "@/lib/useExercises";

export default function GoalsSection({ userId }: { userId: string }) {
  const { all: allExercises } = useExercises();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentValues, setCurrentValues] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  const [kind, setKind] = useState<"exercise" | "body_weight">("exercise");
  const [label, setLabel] = useState(allExercises[0] ?? "");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (allExercises.length && !allExercises.includes(label) && kind === "exercise") {
      setLabel(allExercises[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const list = (data as Goal[]) ?? [];
    setGoals(list);
    await loadCurrentValues(list);
    setLoading(false);
  }

  async function loadCurrentValues(list: Goal[]) {
    const values: Record<string, number | null> = {};
    await Promise.all(
      list.map(async (goal) => {
        if (goal.kind === "body_weight") {
          const { data } = await supabase
            .from("body_weight")
            .select("weight")
            .eq("user_id", userId)
            .order("entry_date", { ascending: false })
            .limit(1);
          values[goal.id] = data && data[0] ? (data[0] as { weight: number }).weight : null;
        } else {
          const { data } = await supabase
            .from("entries")
            .select("weight")
            .eq("user_id", userId)
            .eq("exercise", goal.label)
            .order("entry_date", { ascending: false })
            .limit(1);
          values[goal.id] = data && data[0] ? (data[0] as { weight: number }).weight : null;
        }
      })
    );
    setCurrentValues(values);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetNum = parseFloat(target);
    if (!targetNum) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("goals").insert({
      user_id: userId,
      kind,
      label: kind === "body_weight" ? "Poids de corps" : label,
      target: targetNum,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTarget("");
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-5">
      <section className="bg-panel border border-line rounded-xl p-4">
        <h2 className="font-head font-semibold text-xl mb-3">Nouvel objectif</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-kind">Type</label>
              <select
                id="goal-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as "exercise" | "body_weight")}
              >
                <option value="exercise">Charge</option>
                <option value="body_weight">Poids de corps</option>
              </select>
            </div>
            {kind === "exercise" ? (
              <div>
                <label htmlFor="goal-exercise">Exercice</label>
                <select
                  id="goal-exercise"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                >
                  {allExercises.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="goal-target">Cible (kg)</label>
                <input
                  id="goal-target"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="65"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          {kind === "exercise" && (
            <div>
              <label htmlFor="goal-target-2">Cible (kg)</label>
              <input
                id="goal-target-2"
                type="number"
                step="0.5"
                min="0"
                placeholder="100"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg px-4 py-2.5 disabled:opacity-60"
          >
            {saving ? "Ajout…" : "Ajouter l'objectif"}
          </button>
          {error && <p className="text-[#c0524a] text-xs">{error}</p>}
        </form>
      </section>

      <section className="space-y-3">
        {loading ? (
          <p className="text-dim text-sm py-2">Chargement…</p>
        ) : goals.length === 0 ? (
          <p className="text-dim text-sm py-2">Aucun objectif pour l&rsquo;instant.</p>
        ) : (
          goals.map((goal) => {
            const current = currentValues[goal.id];
            const pct =
              current !== null && current !== undefined
                ? Math.max(0, Math.min(100, (current / goal.target) * 100))
                : 0;
            return (
              <div
                key={goal.id}
                className="bg-panel border border-line rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{goal.label}</p>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-dim hover:text-[#c0524a] text-xs"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-dim mb-1.5">
                  <span>
                    {current !== null && current !== undefined
                      ? `${current} kg actuellement`
                      : "Pas encore de données"}
                  </span>
                  <span>Objectif {goal.target} kg</span>
                </div>
                <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
