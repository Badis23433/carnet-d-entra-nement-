"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase, Profile } from "@/lib/supabase";

const STORAGE_KEY = "carnet_user_id";

type UserContextValue = {
  ready: boolean;
  userId: string | null;
  userName: string | null;
  users: Profile[];
  openSwitcher: () => void;
};

const UserContext = createContext<UserContextValue>({
  ready: false,
  userId: null,
  userName: null,
  users: [],
  openSwitcher: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at");
    if (error) {
      setFormError(error.message);
      setReady(true);
      setShowSwitcher(true);
      return;
    }
    const list = (data as Profile[]) ?? [];
    setUsers(list);
    const savedId =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const found = list.find((u) => u.id === savedId);
    if (found) {
      setUserId(found.id);
      setUserName(found.name);
    } else {
      setShowSwitcher(true);
    }
    setReady(true);
  }

  function selectUser(u: Profile) {
    setUserId(u.id);
    setUserName(u.name);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, u.id);
    }
    setShowSwitcher(false);
    setFormError(null);
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setFormError(null);
    const { data, error } = await supabase
      .from("profiles")
      .insert({ name: trimmed })
      .select()
      .single();
    setCreating(false);
    if (error) {
      setFormError(
        error.message.includes("duplicate")
          ? "Ce nom existe déjà — choisis-le dans la liste."
          : error.message
      );
      return;
    }
    const profile = data as Profile;
    setUsers((prev) => [...prev, profile]);
    setNewName("");
    selectUser(profile);
  }

  return (
    <UserContext.Provider
      value={{
        ready,
        userId,
        userName,
        users,
        openSwitcher: () => setShowSwitcher(true),
      }}
    >
      {children}
      {ready && showSwitcher && (
        <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center px-6">
          {userId && (
            <button
              onClick={() => setShowSwitcher(false)}
              className="absolute top-6 right-6 text-dim text-2xl leading-none"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
          <h1 className="font-head font-bold text-3xl mb-1 text-center">
            Qui es-tu ?
          </h1>
          <p className="text-dim text-sm mb-8 text-center">
            Choisis ton profil pour retrouver tes séances
          </p>

          <div className="w-full max-w-xs space-y-2 mb-6">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full text-left px-4 py-3 rounded-lg border font-medium ${
                  u.id === userId
                    ? "border-accent bg-accentSoft text-white"
                    : "border-line bg-panel hover:border-accent"
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor="new-user">Nouveau profil</label>
            <div className="flex gap-2">
              <input
                id="new-user"
                type="text"
                placeholder="Ton prénom"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="bg-accent hover:bg-accentSoft text-white font-semibold text-sm rounded-lg px-4 disabled:opacity-60 whitespace-nowrap"
              >
                Créer
              </button>
            </div>
            {formError && (
              <p className="text-[#c0524a] text-xs mt-2">{formError}</p>
            )}
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
}
