"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Séance" },
  { href: "/progres", label: "Progrès" },
  { href: "/programme", label: "Programme" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-panel border-t border-line">
      <div className="max-w-md mx-auto flex">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 text-center py-3 text-sm font-medium ${
                active ? "text-accent" : "text-dim"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
