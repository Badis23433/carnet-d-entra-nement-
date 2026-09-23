"use client";

import { useUser } from "@/lib/user-context";

export default function UserBar() {
  const { userName, openSwitcher } = useUser();
  if (!userName) return null;
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-dim text-sm">
        👤 <span className="text-ink font-medium">{userName}</span>
      </span>
      <button onClick={openSwitcher} className="text-accent text-sm">
        Changer
      </button>
    </div>
  );
}
