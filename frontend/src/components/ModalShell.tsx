import { X } from "lucide-react";

export function ModalShell({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`card w-full relative ${wide ? "max-w-md" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 id="modal-title" className="font-bold text-slate-400 pr-10 mb-3">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
