import { useState } from "react";
import { ModalShell } from "../components/ModalShell";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
};

type ConfirmState = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      setState({ ...options, resolve });
    });

  const close = (confirmed: boolean) => {
    if (!state) return;
    state.resolve(confirmed);
    setState(null);
  };

  const dialog = state ? (
    <ModalShell title={state.title ?? "Please confirm"} onClose={() => close(false)}>
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">{state.message}</p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => close(false)}>
            {state.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            className={`flex-1 ${state.variant === "danger" ? "btn-ghost text-red-400 border border-red-500/40" : "btn-primary"}`}
            onClick={() => close(true)}
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </ModalShell>
  ) : null;

  return { confirm, confirmDialog: dialog };
}
