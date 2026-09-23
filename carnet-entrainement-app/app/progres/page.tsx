"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { supabase, Entry, BodyWeightEntry } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import { useExercises } from "@/lib/useExercises";
import { todayISO, formatDateShort } from "@/lib/date-utils";
import UserBar from "@/components/UserBar";
import StreakCard from "@/components/StreakCard";
import GoalsSection from "@/components/GoalsSection";
import PhotosSection from "@/components/PhotosSection";

const CHART_COLORS = {
  stroke: "#4f86a3",
  grid: "#33373d",
  tick: "#9ea1a7",
};

type Tab = "poids" | "charges" | "objectifs" | "photos";

const TABS: { id: Tab; label: string }[] = [
  { id: "poids", label: "Poids de corps" },
  { id: "charges", label: "Charges" },
  { id: "objectifs", label: "Objectifs" },
  { id: "photos", label: "Photos" },
];

export default function ProgresPage() {
  const { userId, ready } = useUser();
  const [tab, setTab] = useState<Tab>("poids");

  return (
    <div className="pb-4">
      <UserBar />
      <header className="mb-5">
        <h1 className="font-head font-bold text-[38px] leading-[0.95]">
          Progrès
        </h1>
        <p className="text-dim text-[14.5px] mt-1">
          Régularité, poids de corps, charges et objectifs
        </p>
      </header>

      {!ready || !userId ? (
        <p className="text-dim text-sm py-10 text-center">Chargement…</p>
      ) : (
        <>
          <StreakCard userId={userId} />

          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`chip ${tab === t.id ? "active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "poids" && <PoidsSection userId={userId} />}
          {tab === "charges" && <ChargesSection userId={userId} />}
          {tab === "objectifs" && <GoalsSection userId={userId} />}
          {tab === "photos" && <PhotosSection userId={userId} />}
        </>
      )}
    </div>
  );
}

function PoidsSection({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("body_weight")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true });
    if (loadError) setError(loadError.message);
    setEntries((data as BodyWeightEntry[]) ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("body_weight").insert({
      user_id: userId,
      entry_date: date,
      weight: parseFloat(weight),
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setWeight("");
    load();
  }

  const chartData = entries.map((e) => ({
    date: formatDateShort(e.entry_date),
    poids: e.weight,
  }));

  const sorted = [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  const latest = sorted[0];
  const first = sorted[sorted.length - 1];
  const totalDiff = latest && first ? latest.weight - first.weight : null;

  return (
    <div className="space-y-5">
      <section className="bg-panel border border-line rounded-xl p-4">
        <h2 className="font-head font-semibold text-xl mb-3">
          Ajouter une pesée
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="w-date">Date</label>
            <input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="w-weight">Poids (kg)</label>
            <input
              id="w-weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="58.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
          >
            {saving ? "Ajout…" : "Enregistrer"}
          </button>
        </form>
        {error && <p className="text-[#c0524a] text-xs mt-2">{error}</p>}
      </section>

      <section className="bg-panel border border-line rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-head font-semibold text-xl">Évolution</h2>
          {totalDiff !== null && (
            <span
              className={`text-sm font-semibold ${
                totalDiff > 0 ? "text-good" : "text-dim"
              }`}
            >
              {totalDiff > 0 ? "+" : ""}
              {totalDiff.toFixed(1)} kg au total
            </span>
          )}
        </div>
        {loading ? (
          <p className="text-dim text-sm py-2">Chargement…</p>
        ) : chartData.length < 2 ? (
          <p className="text-dim text-sm py-2">
            Ajoute au moins deux pesées pour voir le graphique.
          </p>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={CHART_COLORS.tick}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_COLORS.tick}
                  fontSize={12}
                  tickLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1d2024",
                    border: "1px solid #33373d",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "#e9e7e1" }}
                />
                <Line
                  type="monotone"
                  dataKey="poids"
                  stroke={CHART_COLORS.stroke}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.stroke }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function ChargesSection({ userId }: { userId: string }) {
  const { all: allExercises } = useExercises();
  const [filter, setFilter] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editSets, setEditSets] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (allExercises.length && !filter) setFilter(allExercises[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises]);

  useEffect(() => {
    if (filter) load();
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, userId]);

  async function load() {
    setLoading(true);
    setEntries([]);
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise", filter)
      .order("entry_date", { ascending: true });
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(row: Entry) {
    setEditingId(row.id);
    setEditWeight(String(row.weight));
    setEditSets(String(row.sets));
    setEditReps(String(row.reps));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (!editWeight || !editSets || !editReps) return;
    setEditSaving(true);
    const { data, error } = await supabase
      .from("entries")
      .update({
        weight: parseFloat(editWeight),
        sets: parseInt(editSets, 10),
        reps: parseInt(editReps, 10),
      })
      .eq("id", id)
      .select()
      .single();
    setEditSaving(false);
    if (error) return;
    const updated = data as Entry;
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    setEditingId(null);
  }

  const chartData = entries.map((e) => ({
    date: formatDateShort(e.entry_date),
    charge: e.weight,
  }));

  const descending = [...entries].reverse();

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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

      <section className="bg-panel border border-line rounded-xl p-4">
        <h2 className="font-head font-semibold text-xl mb-3">
          {filter ?? "—"}
        </h2>
        {loading ? (
          <p className="text-dim text-sm py-2">Chargement…</p>
        ) : chartData.length < 2 ? (
          <p className="text-dim text-sm py-2">
            Pas encore assez d&rsquo;entrées pour un graphique.
          </p>
        ) : (
          <div style={{ width: "100%", height: 200 }} className="mb-4">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={CHART_COLORS.tick}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_COLORS.tick}
                  fontSize={12}
                  tickLine={false}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1d2024",
                    border: "1px solid #33373d",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "#e9e7e1" }}
                />
                <Line
                  type="monotone"
                  dataKey="charge"
                  stroke={CHART_COLORS.stroke}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.stroke }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading ? (
          <p className="text-dim text-sm py-2">Chargement…</p>
        ) : descending.length === 0 ? (
          <p className="text-dim text-sm py-2">Aucune entrée pour cet exercice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-dim text-xs text-left">
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Date</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Charge</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line">Séries × reps</th>
                  <th className="py-1.5 pr-2 font-medium border-b border-line"></th>
                </tr>
              </thead>
              <tbody>
                {descending.map((row) =>
                  editingId === row.id ? (
                    <tr key={row.id} className="border-b border-line last:border-none">
                      <td className="py-2 pr-2 text-dim">{formatDateShort(row.entry_date)}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="!px-2 !py-1 text-sm w-20"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={editSets}
                            onChange={(e) => setEditSets(e.target.value)}
                            className="!px-2 !py-1 text-sm w-12"
                          />
                          <span className="text-dim">×</span>
                          <input
                            type="number"
                            min="1"
                            value={editReps}
                            onChange={(e) => setEditReps(e.target.value)}
                            className="!px-2 !py-1 text-sm w-12"
                          />
                        </div>
                      </td>
                      <td className="py-2 pr-1 text-right whitespace-nowrap">
                        <button
                          onClick={() => saveEdit(row.id)}
                          disabled={editSaving}
                          className="text-good px-1 disabled:opacity-60"
                          aria-label="Valider"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-dim px-1"
                          aria-label="Annuler"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} className="border-b border-line last:border-none">
                      <td className="py-2 pr-2">{formatDateShort(row.entry_date)}</td>
                      <td className="py-2 pr-2">{row.weight} kg</td>
                      <td className="py-2 pr-2">
                        {row.sets} × {row.reps}
                      </td>
                      <td className="py-2 pr-1 text-right whitespace-nowrap">
                        <button
                          onClick={() => startEdit(row)}
                          className="text-dim hover:text-ink px-1"
                          aria-label="Modifier"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-dim hover:text-[#c0524a] px-1"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
