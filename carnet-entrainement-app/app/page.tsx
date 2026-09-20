"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Entry } from "@/lib/supabase";
import { DEFAULT_EXERCISES } from "@/lib/data";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function SeancesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(DEFAULT_EXERCISES[0]);

  const [date, setDate] = useState(todayISO());
  const [exercise, setExercise] = useState(DEFAULT_EXERCISES[0]);
  const [weight, setWeight] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...customExercises],
    [customExercises]
  );

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [entriesRes, exercisesRes] = await Promise.all([
      supabase
        .from("entries")
        .select("*")
        .order("entry_date", { ascending: false }),
      supabase.from("exercises").select("name").order("created_at"),
    ]);

    if (entriesRes.error) setError(entriesRes.error.message);
    else setEntries(entriesRes.data as Entry[]);

    if (!exercisesRes.error && exercisesRes.data) {
      const names = exercisesRes.data
        .map((r: { name: string }) => r.name)
        .filter((n) => !DEFAULT_EXERCISES.includes(n));
      setCustomExercises(names);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight || !sets || !reps) return;
    setSaving(true);
    const { error: insertError } = await supabase.from("entries").insert({
      exercise,
      entry_date: date,
      weight: parseFloat(weight),
      sets: parseInt(sets, 10),
      reps: parseInt(reps, 10),
      note: note.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setWeight("");
    setSets("");
    setReps("");
    setNote("");
    setFilter(exercise);
    loadAll();
  }

  async function handleAddExercise() {
    const name = window.prompt("Nom du nouvel exercice :");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (allExercises.includes(trimmed)) {
      setExercise(trimmed);
      return;
    }
    const { error: insertError } = await supabase
      .from("exercises")
      .insert({ name: trimmed });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCustomExercises((prev) => [...prev, trimmed]);
    setExercise(trimmed);
    setFilter(trimmed);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from("entries")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((prev) => prev.filter((en) => en.id !== id));
  }

  const filteredRows = entries
    .filter((en) => en.exercise === filter)
    .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));

  return (
    <div className="pb-4">
      <header className="mb-6">
        <h1 className="font-head font-bold text-[42px] leading-[0.95]">
          Carnet d&rsquo;entraînement
        </h1>
        <p className="text-dim text-[14.5px] mt-1">
          Push / Pull / Legs — suivi de tes charges
        </p>
      </header>

      <section className="bg-panel border border-line rounded-xl p-4 mb-5">
        <h2 className="font-head font-semibold text-xl mb-3">
          Nouvelle entrée
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="exercise">Exercice</label>
              <select
                id="exercise"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              >
                {allExercises.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="weight">Charge (kg)</label>
              <input
                id="weight"
                type="number"
                step="0.5"
                min="0"
                placeholder="62.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="sets">Séries</label>
              <input
                id="sets"
                type="number"
                min="1"
                placeholder="4"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="reps">Reps</label>
              <input
                id="reps"
                type="number"
                min="1"
                placeholder="6"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="note">Note (optionnel)</label>
            <input
              id="note"
              type="text"
              placeholder="dernière série difficile"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg px-4 py-2.5 disabled:opacity-60"
            >
              {saving ? "Ajout…" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={handleAddExercise}
              className="border border-line text-dim hover:text-ink text-sm rounded-lg px-3 py-2.5"
            >
              + Nouvel exercice
            </button>
          </div>
        </form>
      </section>

      <section className="bg-panel border border-line rounded-xl p-4">
        <h2 className="font-head font-semibold text-xl mb-3">Historique</h2>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 -mx-1 px-1">
          {allExercises.map((ex) => (
            <div
              key={ex}
              onClick={() => setFilter(ex)}
              className={`chip ${filter === ex ? "active" : ""}`}
            >
              {ex}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-[#c0524a] mb-2">Erreur : {error}</p>
        )}

        {loading ? (
          <p className="text-dim text-sm py-2">Chargement…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-dim text-sm py-2">
            Aucune entrée pour cet exercice pour l&rsquo;instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-dim text-xs text-left">
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Date</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Charge</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Séries × reps</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Évolution</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => {
                  const prev = filteredRows[i + 1];
                  const diff = prev ? row.weight - prev.weight : null;
                  return (
                    <tr key={row.id} className="border-b border-line last:border-none">
                      <td className="py-2 pr-2">{formatDate(row.entry_date)}</td>
                      <td className="py-2 pr-2">{row.weight} kg</td>
                      <td className="py-2 pr-2">
                        {row.sets} × {row.reps}
                      </td>
                      <td className="py-2 pr-2">
                        {diff === null ? (
                          <span className="text-dim">—</span>
                        ) : diff > 0 ? (
                          <span className="text-good font-semibold">
                            +{diff.toFixed(1)} kg
                          </span>
                        ) : diff < 0 ? (
                          <span className="text-dim">{diff.toFixed(1)} kg</span>
                        ) : (
                          <span className="text-dim">=</span>
                        )}
                      </td>
                      <td className="py-2 pr-1 text-right">
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-dim hover:text-[#c0524a] px-1"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
