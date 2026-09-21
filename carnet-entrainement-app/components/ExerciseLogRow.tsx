"use client";

import { useState } from "react";
import { supabase, Entry } from "@/lib/supabase";
import { ProgramExercise } from "@/lib/data";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExerciseLogRow({
  exercise,
  userId,
  lastEntry,
  onSaved,
}: {
  exercise: ProgramExercise;
  userId: string;
  lastEntry: Entry | undefined;
  onSaved: (entry: Entry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(lastEntry ? String(lastEntry.weight) : "");
  const [sets, setSets] = useState(lastEntry ? String(lastEntry.sets) : "");
  const [reps, setReps] = useState(lastEntry ? String(lastEntry.reps) : "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!weight || !sets || !reps) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        exercise: exercise.name,
        entry_date: todayISO(),
        weight: parseFloat(weight),
        sets: parseInt(sets, 10),
        reps: parseInt(reps, 10),
      })
      .select()
      .single();
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved(data as Entry);
    setSavedFlash(true);
    setOpen(false);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="border-b border-line last:border-none py-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium">{exercise.name}</p>
          <p className="text-dim text-xs">
            {exercise.sets} · {exercise.target}
            {lastEntry && (
              <span className="text-good">
                {" "}
                · dernière fois {lastEntry.weight} kg
              </span>
            )}
          </p>
        </div>
        <span className="text-dim text-lg pl-3">
          {savedFlash ? <span className="text-good">✓</span> : open ? "–" : "+"}
        </span>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className="!mb-1">Charge (kg)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="!mb-1">Séries</label>
            <input
              type="number"
              min="1"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
          </div>
          <div>
            <label className="!mb-1">Reps</label>
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="col-span-3 bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg py-2 mt-1 disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Valider la série"}
          </button>
          {error && <p className="col-span-3 text-[#c0524a] text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}
