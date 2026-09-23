"use client";

import { useEffect } from "react";
import { useRestTimer } from "@/lib/rest-timer-context";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function RestTimerBar() {
  const { active, label, secondsLeft, totalSeconds, finished, addTime, stop } =
    useRestTimer();

  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => stop(), 5000);
    return () => clearTimeout(t);
  }, [finished, stop]);

  if (!active) return null;

  const progress =
    totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;

  return (
    <div className="bg-panel2 border-t border-accent">
      <div
        className="h-0.5 bg-accent"
        style={{ width: `${progress * 100}%`, transition: "width 1s linear" }}
      />
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
        <div>
          <p className="text-xs text-dim">
            {finished ? "Repos terminé ✓" : `Repos · ${label}`}
          </p>
          <p className="font-head font-semibold text-2xl leading-none">
            {finished ? "0:00" : formatTime(secondsLeft)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!finished && (
            <button
              onClick={() => addTime(30)}
              className="border border-line text-dim text-xs rounded-lg px-2.5 py-1.5"
            >
              +30s
            </button>
          )}
          <button
            onClick={stop}
            className="text-accent text-xs font-medium px-2 py-1.5"
          >
            {finished ? "Fermer" : "Passer"}
          </button>
        </div>
      </div>
    </div>
  );
}
