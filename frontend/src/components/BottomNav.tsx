import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-card/95 backdrop-blur-lg border-t border-slate-700/50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs transition-colors ${
                isActive ? "text-brand-500" : "text-slate-400"
              }`
            }
          >
            <Icon className="w-6 h-6" strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
