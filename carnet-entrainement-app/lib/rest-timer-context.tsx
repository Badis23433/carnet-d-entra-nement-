"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

type RestTimerValue = {
  active: boolean;
  label: string | null;
  secondsLeft: number;
  totalSeconds: number;
  finished: boolean;
  start: (seconds: number, label: string) => void;
  addTime: (delta: number) => void;
  stop: () => void;
};

const RestTimerContext = createContext<RestTimerValue>({
  active: false,
  label: null,
  secondsLeft: 0,
  totalSeconds: 0,
  finished: false,
  start: () => {},
  addTime: () => {},
  stop: () => {},
});

export function useRestTimer() {
  return useContext(RestTimerContext);
}

type AudioCtxCtor = typeof AudioContext;

function getCtor(): AudioCtxCtor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext ||
    null
  );
}

function playTone(ctx: AudioContext, freq: number, startAt: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5);
  osc.start(startAt);
  osc.stop(startAt + 0.55);
}

export default function RestTimerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Un seul AudioContext, réutilisé et "réveillé" à chaque lancement de repos
  // (idéalement proche d'un tap utilisateur) plutôt que recréé au moment du
  // bip — les navigateurs mobiles (surtout iOS) bloquent souvent un contexte
  // audio flambant neuf créé hors d'un geste utilisateur direct.
  const audioCtxRef = useRef<AudioContext | null>(null);

  const primeAudio = useCallback(() => {
    try {
      const Ctor = getCtor();
      if (!Ctor) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctor();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
    } catch {
      // Web Audio indisponible : la vibration (si supportée) prendra le relai.
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      playTone(ctx, 880, ctx.currentTime);
      playTone(ctx, 1040, ctx.currentTime + 0.25);
    } catch {
      // Ignore silencieusement si le son échoue.
    }
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number, exerciseLabel: string) => {
      primeAudio();
      clear();
      setActive(true);
      setFinished(false);
      setLabel(exerciseLabel);
      setTotalSeconds(seconds);
      setSecondsLeft(seconds);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clear();
            setFinished(true);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            playBeep();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    },
    [clear, primeAudio, playBeep]
  );

  const addTime = useCallback((delta: number) => {
    setSecondsLeft((s) => Math.max(0, s + delta));
    setTotalSeconds((t) => Math.max(t, t + delta));
  }, []);

  const stop = useCallback(() => {
    clear();
    setActive(false);
    setFinished(false);
    setLabel(null);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return (
    <RestTimerContext.Provider
      value={{ active, label, secondsLeft, totalSeconds, finished, start, addTime, stop }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}
