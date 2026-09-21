"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Entry } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useExercises } from "@/lib/useExercises";
import { PROGRAM, ProgramDay } from "@/lib/data";
import UserBar from "@/components/UserBar";
import ExerciseLogRow from "@/components/ExerciseLogRow";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SeancePage() {
  const { userId, ready } = useUser();
  const { all: allExercises, addExercise } = useExercises();

  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null);
  const selectedDayRef = useRef<string | null>(null);
  const [lastByExercise, setLastByExercise] = useState<Record<string, Entry>>({});
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);

  const [freeMode, setFreeMode] = useState(false);
  const [freeExercise, setFreeExercise] = useState(allExercises[0] ?? "");
  const [freeWeight, setFreeWeight] = useState("");
  const [freeSets, setFreeSets] = useState("");
  const [freeReps, setFreeReps] = useState("");
  const [freeSaving, setFreeSaving] = useState(false);

  useEffect(() => {
    if (userId) loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    // Le profil a changé : on repart de l'écran de choix du jour pour éviter
    // d'afficher les "dernière fois" de l'utilisateur précédent.
    setSelectedDay(null);
    selectedDayRef.current = null;
    setLastByExercise({});
    setFreeMode(false);
  }, [userId]);

  useEffect(() => {
    if (allExercises.length && !allExercises.includes(freeExercise)) {
      setFreeExercise(allExercises[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises]);

  async function loadToday() {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", todayISO())
      .order("created_at", { ascending: false });
    setTodayEntries((data as Entry[]) ?? []);
  }

  async function pickDay(day: ProgramDay) {
    setSelectedDay(day);
    selectedDayRef.current = day.title;
    setFreeMode(false);
    if (!userId) return;
    const names = day.exercises.map((e) => e.name);
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .in("exercise", names)
      .order("entry_date", { ascending: false });
    if (selectedDayRef.current !== day.title) return; // une autre séance a été choisie entre-temps
    const map: Record<string, Entry> = {};
    (data as Entry[] | null)?.forEach((e) => {
      if (!map[e.exercise]) map[e.exercise] = e;
    });
    setLastByExercise(map);
  }

  function handleSaved(entry: Entry) {
    setTodayEntries((prev) => [entry, ...prev]);
    setLastByExercise((prev) => ({ ...prev, [entry.exercise]: entry }));
  }

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !freeWeight || !freeSets || !freeReps) return;
    setFreeSaving(true);
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        exercise: freeExercise,
        entry_date: todayISO(),
        weight: parseFloat(freeWeight),
        sets: parseInt(freeSets, 10),
        reps: parseInt(freeReps, 10),
      })
      .select()
      .single();
    setFreeSaving(false);
    if (error) return;
    handleSaved(data as Entry);
    setFreeWeight("");
    setFreeSets("");
    setFreeReps("");
  }

  async function handleAddExercise() {
    const name = window.prompt("Nom du nouvel exercice :");
    if (!name) return;
    const added = await addExercise(name);
    if (added) setFreeExercise(added);
  }

  if (!ready || !userId) {
    return <p className="text-dim text-sm py-10 text-center">Chargement…</p>;
  }

  return (
    <div className="pb-4">
      <UserBar />
      <header className="mb-6">
        <h1 className="font-head font-bold text-[38px] leading-[0.95]">
          Séance
        </h1>
        <p className="text-dim text-[14.5px] mt-1">
          {selectedDay ? selectedDay.title : "Choisis ta séance du jour"}
        </p>
      </header>

      {!selectedDay && !freeMode && (
        <div className="space-y-3">
          {PROGRAM.map((day) => (
            <button
              key={day.title}
              onClick={() => pickDay(day)}
              className="w-full text-left bg-panel border border-line hover:border-accent rounded-xl p-4"
            >
              <p className="font-head font-semibold text-xl">{day.title}</p>
              <p className="text-dim text-sm">{day.subtitle}</p>
            </button>
          ))}
          <button
            onClick={() => setFreeMode(true)}
            className="w-full text-left bg-panel border border-line hover:border-accent rounded-xl p-4"
          >
            <p className="font-head font-semibold text-xl">Autre exercice</p>
            <p className="text-dim text-sm">
              Callisthénie à la maison ou séance libre
            </p>
          </button>
        </div>
      )}

      {selectedDay && (
        <section className="bg-panel border border-line rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-head font-semibold text-xl">
              {selectedDay.title}
            </h2>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-dim text-sm"
            >
              Changer
            </button>
          </div>
          <div>
            {selectedDay.exercises.map((ex) => (
              <ExerciseLogRow
                key={ex.name}
                exercise={ex}
                userId={userId}
                lastEntry={lastByExercise[ex.name]}
                onSaved={handleSaved}
              />
            ))}
          </div>
        </section>
      )}

      {freeMode && (
        <section className="bg-panel border border-line rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-head font-semibold text-xl">
              Exercice libre
            </h2>
            <button onClick={() => setFreeMode(false)} className="text-dim text-sm">
              Retour
            </button>
          </div>
          <form onSubmit={handleFreeSubmit} className="space-y-3">
            <div>
              <label htmlFor="free-exercise">Exercice</label>
              <select
                id="free-exercise"
                value={freeExercise}
                onChange={(e) => setFreeExercise(e.target.value)}
              >
                {allExercises.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="free-weight">Charge (kg)</label>
                <input
                  id="free-weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={freeWeight}
                  onChange={(e) => setFreeWeight(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="free-sets">Séries</label>
                <input
                  id="free-sets"
                  type="number"
                  min="1"
                  value={freeSets}
                  onChange={(e) => setFreeSets(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="free-reps">Reps</label>
                <input
                  id="free-reps"
                  type="number"
                  min="1"
                  value={freeReps}
                  onChange={(e) => setFreeReps(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={freeSaving}
                className="bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg px-4 py-2.5 disabled:opacity-60"
              >
                {freeSaving ? "Ajout…" : "Ajouter"}
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
      )}

      {todayEntries.length > 0 && (
        <section className="bg-panel border border-line rounded-xl p-4">
          <h2 className="font-head font-semibold text-xl mb-3">
            Aujourd&rsquo;hui
          </h2>
          <div className="space-y-2">
            {todayEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between text-sm border-b border-line last:border-none pb-2 last:pb-0"
              >
                <span>{e.exercise}</span>
                <span className="text-dim">
                  {e.weight} kg · {e.sets}×{e.reps}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
