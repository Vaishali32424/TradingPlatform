import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../api/client";
import { PersonRow } from "../../components/PersonRow";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import type { Broker } from "../../types";
import { BrokerFormModal } from "./BrokerFormModal";
import { toastSuccess } from "../../utils/toast";

export default function BrokerManagement() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [modal, setModal] = useState<"create" | Broker | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = () => api.get("/superadmin/brokers").then((res) => setBrokers(res.data));

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyLink = (brokerId: string) => {
    const url = `${window.location.origin}/signup?brokerId=${brokerId}`;
    navigator.clipboard.writeText(url);
    toastSuccess("Signup link copied");
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this broker?")) return;
    await api.delete(`/superadmin/brokers/${id}`);
    load();
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Broker management</h2>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setModal("create")}>
          <Plus className="w-4 h-4" /> Add broker
        </button>
      </div>

      <div className="space-y-3">
        {brokers.map((b) => {
          const isOpen = expanded.has(b._id);
          const users = b.users ?? [];
          return (
            <div key={b._id} className="card space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  className="flex items-start gap-3 text-left flex-1"
                  onClick={() => toggleExpand(b._id)}
                >
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <ProfileAvatar name={b.name} photoUrl={b.profilePhoto} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-brand-500">{b.brokerId}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {b.userCount ?? 0} user{(b.userCount ?? 0) !== 1 ? "s" : ""} · $
                      {b.totalReceived.toLocaleString()} received
                      {!b.isActive && (
                        <span className="ml-2 text-red-400">(inactive)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Bank: {b.bankAccountNumber} · IFSC: {b.ifscCode}
                    </p>
                    {b.aadharNumber && (
                      <p className="text-xs text-slate-500">Aadhar: {b.aadharNumber}</p>
                    )}
                    {b.panNumber && (
                      <p className="text-xs text-slate-500">PAN: {b.panNumber}</p>
                    )}
                  </div>
                </button>
                <div className="flex gap-2 sm:shrink-0">
                  <button type="button" className="btn-ghost" onClick={() => copyLink(b.brokerId)} title="Copy signup link">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setModal(b)}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" className="btn-ghost text-red-400" onClick={() => deactivate(b._id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
                    Users under {b.name} ({b.brokerId})
                  </p>
                  {users.length === 0 ? (
                    <p className="text-sm text-slate-500">No users registered with this broker yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {users.map((u) => (
                        <li
                          key={u._id}
                          className="text-sm bg-slate-800/40 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                        >
                          <PersonRow
                            name={u.name}
                            id={u.userId}
                            photoUrl={u.profilePhoto}
                            size="sm"
                          />
                          <span className="text-slate-400 shrink-0">
                            Balance: ${u.totalDeposited.toLocaleString()}
                            {!u.isActive && (
                              <span className="text-red-400 ml-2">inactive</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <BrokerFormModal
          broker={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
