import { PROGRAM, HOME_WORKOUT, NUTRITION_TIPS } from "@/lib/data";

export default function ProgrammePage() {
  return (
    <div className="pb-4">
      <header className="mb-6">
        <h1 className="font-head font-bold text-[34px] leading-[0.95]">
          Programme &amp; conseils
        </h1>
        <p className="text-dim text-[14.5px] mt-1">
          Split Push / Pull / Legs — jambes en priorité
        </p>
      </header>

      <section className="space-y-4 mb-6">
        {PROGRAM.map((day) => (
          <div
            key={day.title}
            className="bg-panel border border-line rounded-xl p-4"
          >
            <h2 className="font-head font-semibold text-xl">{day.title}</h2>
            <p className="text-dim text-sm mb-3">{day.subtitle}</p>
            <div className="space-y-2">
              {day.exercises.map((ex) => (
                <div
                  key={ex.name}
                  className="flex items-center justify-between text-sm border-b border-line last:border-none pb-2 last:pb-0"
                >
                  <span>{ex.name}</span>
                  <span className="text-dim text-right whitespace-nowrap pl-3">
                    {ex.sets} · {ex.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-panel border border-line rounded-xl p-4 mb-6">
        <h2 className="font-head font-semibold text-xl mb-1">
          Séance maison
        </h2>
        <p className="text-dim text-sm mb-3">
          Callisthénie — en complément, 1-2×/semaine
        </p>
        <ul className="space-y-1.5 text-sm">
          {HOME_WORKOUT.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-panel border border-line rounded-xl p-4">
        <h2 className="font-head font-semibold text-xl mb-3">Nutrition</h2>
        <div className="space-y-3">
          {NUTRITION_TIPS.map((tip) => (
            <div key={tip.title}>
              <p className="text-sm font-medium">{tip.title}</p>
              <p className="text-dim text-sm">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
