import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserBottomNav, type UserNavItem } from "./UserBottomNav";

export function UserAppShell({ navItems }: { navItems: UserNavItem[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 md:hidden">
        <div className="px-4 h-12 flex items-center justify-between">
          <p className="font-bold text-slate-800">TradeVault</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="p-2 text-slate-500 hover:text-slate-800"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <p className="font-bold">TradeVault · {user?.name}</p>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, externalUrl }) =>
              externalUrl ? (
                <a
                  key={to}
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {label}
                </a>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {label}
                </NavLink>
              )
            )}
          </nav>
          <button type="button" onClick={() => { logout(); navigate("/login"); }} className="text-sm text-slate-500">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>

      <UserBottomNav items={navItems} />
    </div>
  );
}
