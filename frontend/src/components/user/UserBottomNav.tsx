import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface UserNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Opens in a new tab instead of in-app navigation */
  externalUrl?: string;
}

export function UserBottomNav({ items }: { items: UserNavItem[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-3xl mx-auto">
        {items.map(({ to, label, icon: Icon, externalUrl }) =>
          externalUrl ? (
            <a
              key={to}
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium text-slate-500 transition-colors hover:text-blue-600"
            >
              <span className="p-1.5 rounded-full transition-colors">
                <Icon className="w-6 h-6" strokeWidth={1.75} />
              </span>
              <span>{label}</span>
            </a>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`p-1.5 rounded-full transition-colors ${
                      isActive ? "bg-blue-50" : ""
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
