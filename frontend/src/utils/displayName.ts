/** Show "Name (ID)" everywhere in the UI */
export function formatPersonLabel(name: string, id: string): string {
  return `${name} (${id})`;
}

export function withdrawalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
    on_hold: "On hold",
  };
  return map[status] ?? status;
}

export function withdrawalStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    declined: "bg-red-500/20 text-red-400",
    on_hold: "bg-slate-500/20 text-slate-300",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-300";
}
