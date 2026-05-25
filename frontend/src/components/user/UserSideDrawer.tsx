import { X, History } from "lucide-react";
import { Link } from "react-router-dom";
import { ForexWordmark } from "../ForexWordmark";

export function UserSideDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 bottom-0 z-[51] w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
          <ForexWordmark variant="light" size="sm" />
          <button type="button" className="p-2 text-slate-500" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          <Link
            to="/user/order-history"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-800 hover:bg-slate-100"
          >
            <History className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Order history</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
