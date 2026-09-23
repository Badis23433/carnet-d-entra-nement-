"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { todayISO, startOfWeekISO, addDaysISO } from "@/lib/date-utils";

const WEEKS_SHOWN = 7;
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function weekHasTraining(weekStartISO: string, trainedDates: Set<string>) {
  for (let i = 0; i < 7; i++) {
    if (trainedDates.has(addDaysISO(weekStartISO, i))) return true;
  }
  return false;
}

function computeWeekStreak(trainedDates: Set<string>): number {
  let cursor = startOfWeekISO(todayISO());
  if (!weekHasTraining(cursor, trainedDates)) {
    cursor = addDaysISO(cursor, -7);
  }
  let streak = 0;
  while (weekHasTraining(cursor, trainedDates)) {
    streak++;
    cursor = addDaysISO(cursor, -7);
  }
  return streak;
}

export default function StreakCard({ userId }: { userId: string }) {
  const [trainedDates, setTrainedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("entries")
      .select("entry_date")
      .eq("user_id", userId);
    const set = new Set<string>(
      (data as { entry_date: string }[] | null)?.map((r) => r.entry_date) ?? []
    );
    setTrainedDates(set);
    setLoading(false);
  }

  if (loading) {
    return (
      <section className="bg-panel border border-line rounded-xl p-4 mb-5">
        <p className="text-dim text-sm">Chargement…</p>
      </section>
    );
  }

  const streak = computeWeekStreak(trainedDates);
  const today = todayISO();
  const currentWeekStart = startOfWeekISO(today);
  const weeks: string[][] = [];
  for (let w = WEEKS_SHOWN - 1; w >= 0; w--) {
    const weekStart = addDaysISO(currentWeekStart, -7 * w);
    weeks.push(Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)));
  }

  return (
    <section className="bg-panel border border-line rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-head font-semibold text-xl">Régularité</h2>
        <span className="text-good text-sm font-semibold">
          {streak > 0
            ? `${streak} semaine${streak > 1 ? "s" : ""} d'affilée`
            : "Pas encore de série en cours"}
        </span>
      </div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1">
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              className="text-dim text-[9px] w-3 h-3.5 flex items-center"
            >
              {i === 0 || i === 3 || i === 6 ? d : ""}
            </span>
          ))}
        </div>
        <div className="flex justify-between gap-1 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((date) => {
                const trained = trainedDates.has(date);
                const isToday = date === today;
                const isFuture = date > today;
                return (
                  <div
                    key={date}
                    title={date}
                    className={`w-3.5 h-3.5 rounded-sm ${
                      isFuture
                        ? "bg-transparent"
                        : trained
                        ? "bg-accent"
                        : "bg-panel2 border border-line"
                    } ${isToday ? "ring-1 ring-good" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
