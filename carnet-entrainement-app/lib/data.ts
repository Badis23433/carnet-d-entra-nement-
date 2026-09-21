export const DEFAULT_EXERCISES = [
  "Développé couché",
  "Développé incliné haltères",
  "Dips lestés",
  "Développé militaire haltères",
  "Tractions lestées",
  "Soulevé de terre",
  "Rowing barre",
  "Curl biceps haltères",
  "Squat",
  "Presse à cuisses",
  "Fentes marchées",
  "Leg curl",
  "Mollets debout",
];

export type ProgramExercise = {
  name: string;
  sets: string;
  target: string;
};

export type ProgramDay = {
  title: string;
  subtitle: string;
  exercises: ProgramExercise[];
};

export const PROGRAM: ProgramDay[] = [
  {
    title: "Jour 1 — Push",
    subtitle: "Pecs / Épaules / Triceps",
    exercises: [
      { name: "Échauffement : tractions + dips", sets: "2 × 8-10", target: "Poids du corps" },
      { name: "Développé couché barre", sets: "4 × 6-8", target: "~50 kg" },
      { name: "Développé incliné haltères", sets: "3 × 8-10", target: "16-18 kg/haltère" },
      { name: "Dips lestés", sets: "3 × 8-10", target: "+5 kg" },
      { name: "Développé militaire haltères", sets: "3 × 10", target: "12-14 kg/haltère" },
      { name: "Élévations latérales", sets: "3 × 12-15", target: "6-8 kg" },
      { name: "Extension triceps poulie", sets: "3 × 12", target: "Modérée" },
    ],
  },
  {
    title: "Jour 2 — Pull",
    subtitle: "Dos / Biceps",
    exercises: [
      { name: "Échauffement : tractions + dips", sets: "2 × 8-10", target: "Poids du corps" },
      { name: "Tractions lestées", sets: "4 × 6-8", target: "+5 kg" },
      { name: "Soulevé de terre", sets: "4 × 5", target: "75-80 kg" },
      { name: "Rowing barre buste penché", sets: "3 × 8-10", target: "40-45 kg" },
      { name: "Tirage horizontal poulie basse", sets: "3 × 10-12", target: "Modérée" },
      { name: "Curl biceps haltères", sets: "3 × 10-12", target: "10-12 kg/haltère" },
      { name: "Curl marteau", sets: "2 × 12", target: "8-10 kg/haltère" },
    ],
  },
  {
    title: "Jour 3 — Legs",
    subtitle: "Priorité — volume renforcé",
    exercises: [
      { name: "Échauffement mobilité + squat au poids du corps", sets: "2 × 10-12", target: "Poids du corps" },
      { name: "Squat", sets: "5 × 5", target: "60-65 kg" },
      { name: "Presse à cuisses", sets: "4 × 10", target: "Modérée-lourde" },
      { name: "Fentes marchées haltères", sets: "3 × 10/jambe", target: "10-12 kg/haltère" },
      { name: "Leg curl", sets: "3 × 12", target: "Modérée" },
      { name: "Mollets debout", sets: "4 × 15", target: "Modérée-lourde" },
    ],
  },
];

export const HOME_WORKOUT = [
  "Pompes lestées (gilet) — 4 × 10-12",
  "Dips lestés — 4 × 8-10",
  "Tractions lestées — 4 × 6-8",
  "Tractions prise serrée — 3 × max",
  "Squats bulgares (banc + haltères) — 3 × 10/jambe",
  "Gainage + travail de skill (planche à un bras…)",
];

export const NUTRITION_TIPS = [
  {
    title: "Ne saute pas de repas",
    body: "Ajoute systématiquement une portion en plus au dîner familial (féculents + protéine).",
  },
  {
    title: "Vise 100-130 g de protéines/jour",
    body: "Poulet, œufs, poisson, légumineuses, produits laitiers — répartis sur la journée.",
  },
  {
    title: "Ajoute des calories faciles",
    body: "Fruits secs, beurre de cacahuète, avoine, fromage, huile d'olive sur les plats.",
  },
  {
    title: "Collation avant de dormir",
    body: "Yaourt grec + miel + fruits secs, ou pain complet + fromage.",
  },
  {
    title: "Créatine",
    body: "5 g/jour, tous les jours, avec de l'eau — même les jours off.",
  },
  {
    title: "Whey protéine",
    body: "1 shake après l'entraînement (25-30 g), un 2e dans la journée si besoin pour atteindre ton total.",
  },
];
