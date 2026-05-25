import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPersonLabel } from "../utils/displayName";
import { BottomNav, type NavItem } from "./BottomNav";

export function AppShell({
  title,
  navItems,
}: {
  title: string;
  navItems: NavItem[];
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">TradeVault</p>
            <h1 className="font-semibold text-sm md:text-base">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-slate-400">
              {user ? formatPersonLabel(user.name, user.loginId) : ""}
            </span>
            <button type="button" onClick={handleLogout} className="btn-ghost" aria-label="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="hidden md:flex max-w-6xl mx-auto px-4 gap-1 pb-3">
          {navItems.map(({ to, label }) => (
            <NavLinkDesktop key={to} to={to} label={label} />
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <BottomNav items={navItems} />
    </div>
  );
}

function NavLinkDesktop({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm transition-colors ${
          isActive ? "bg-brand-600/20 text-brand-500" : "text-slate-300 hover:bg-surface-muted/50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
