"use client";

import type { UserProfile } from "@/types";

interface HeaderProps {
  users: UserProfile[];
  activeUserId: string;
  onUserChange: (id: string) => void;
}

export function Header({ users, activeUserId, onUserChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">AFE</h1>
          <p className="text-xs text-gray-400">Autonomous Finance Engine</p>
        </div>
      </div>

      <nav className="flex gap-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onUserChange(u.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
              activeUserId === u.id
                ? "bg-brand-50 text-brand-600 border-brand-400"
                : "text-gray-600 hover:bg-gray-50 border-transparent",
            ].join(" ")}
          >
            {u.name}
          </button>
        ))}
      </nav>
    </header>
  );
}
