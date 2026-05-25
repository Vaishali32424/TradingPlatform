import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LineChart, Wallet, Banknote } from "lucide-react";
import api from "../../api/client";
import type { PlatformUser, Trade, WithdrawalRequest } from "../../types";
import {
  formatPersonLabel,
  withdrawalStatusClass,
  withdrawalStatusLabel,
} from "../../utils/displayName";
import { PasswordInput } from "../../components/PasswordInput";
import { PersonRow } from "../../components/PersonRow";
import { TradeCard } from "../../components/TradeCard";
import { formatTradeAmount } from "../../utils/trade";
import type { TradeCurrency, TradeSide } from "../../types";
import { computeTradePL } from "../../utils/trade";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";

export default function BrokerUserManagement() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [userModal, setUserModal] = useState<"create" | PlatformUser | null>(null);
  const [tradeModal, setTradeModal] = useState(false);
  const [moneyModal, setMoneyModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({
    companyName: "",
    lots: "",
    side: "buy" as TradeSide,
    buyAmount: "",
    sellAmount: "",
    currency: "USD" as TradeCurrency,
    notes: "",
  });
  const [moneyForm, setMoneyForm] = useState({ amount: "", note: "" });
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: "approved" as WithdrawalRequest["status"],
    brokerRemark: "",
  });

  const loadUsers = () => api.get("/broker/users").then((res) => setUsers(res.data));

  const loadWithdrawals = () =>
    api.get("/broker/withdrawals").then((res) => setWithdrawals(res.data));

  useEffect(() => {
    loadUsers();
    loadWithdrawals();
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/broker/users/${selected._id}/trades`).then((res) => setTrades(res.data));
  }, [selected]);

  const saveUser = async (e: React.FormEvent, form: Record<string, string>, id?: string) => {
    e.preventDefault();
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        aadharNumber: form.aadharNumber.trim(),
        panNumber: form.panNumber.trim().toUpperCase(),
        dematNumber: form.dematNumber.trim(),
      };
      if (id) {
        if (form.password.trim()) {
          payload.password = form.password;
          payload.confirmPassword = form.password;
        }
        await api.put(`/broker/users/${id}`, payload);
        toastSuccess("User updated successfully");
      } else {
        payload.password = form.password;
        payload.confirmPassword = form.password;
        await api.post("/broker/users", payload);
        toastSuccess("User created successfully");
      }
      setUserModal(null);
      loadUsers();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not save user"));
    }
  };

  const saveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.post("/broker/trades", {
        userId: selected.userId,
        companyName: tradeForm.companyName.trim(),
        lots: Number(tradeForm.lots),
        side: tradeForm.side,
        buyAmount: Number(tradeForm.buyAmount),
        sellAmount: Number(tradeForm.sellAmount),
        currency: tradeForm.currency,
        notes: tradeForm.notes.trim() || undefined,
      });
      toastSuccess("Trade added successfully");
      setTradeModal(false);
      setTradeForm({
        companyName: "",
        lots: "",
        side: "buy",
        buyAmount: "",
        sellAmount: "",
        currency: "USD",
        notes: "",
      });
      api.get(`/broker/users/${selected._id}/trades`).then((res) => setTrades(res.data));
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not add trade"));
    }
  };

  const addMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const { data } = await api.post(`/broker/users/${selected._id}/add-money`, {
        amount: Number(moneyForm.amount),
        note: moneyForm.note.trim() || undefined,
      });
      toastSuccess(data.message ?? "Money added successfully");
      setMoneyModal(false);
      setMoneyForm({ amount: "", note: "" });
      loadUsers();
      const updated = await api.get("/broker/users");
      const u = updated.data.find((x: PlatformUser) => x._id === selected._id);
      if (u) setSelected(u);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not add money"));
    }
  };

  const reviewWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;
    try {
      const { data } = await api.put(`/broker/withdrawals/${reviewId}`, reviewForm);
      toastSuccess(data.message ?? "Withdrawal updated");
      setReviewId(null);
      setReviewForm({ status: "approved", brokerRemark: "" });
      loadWithdrawals();
      loadUsers();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not update withdrawal"));
    }
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    try {
      await api.delete(`/broker/trades/${id}`);
      toastSuccess("Trade deleted");
      if (selected) api.get(`/broker/users/${selected._id}/trades`).then((res) => setTrades(res.data));
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not delete trade"));
    }
  };

  const userWithdrawals = selected
    ? withdrawals.filter((w) => w.userId === selected.userId)
    : [];
  const pendingAll = withdrawals.filter((w) => w.status === "pending");

  return (
    <div className="page-container space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold">User management</h2>
        <button
          type="button"
          className="btn-primary flex items-center gap-1"
          onClick={() => setUserModal("create")}
        >
          <Plus className="w-4 h-4" /> Add user
        </button>
      </div>

      {pendingAll.length > 0 && (
        <div className="card border-amber-500/30">
          <p className="text-sm text-amber-400 font-medium">
            {pendingAll.length} pending withdrawal request(s) — review below
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => setSelected(u)}
              className={`card w-full text-left ${selected?._id === u._id ? "ring-2 ring-brand-500" : ""}`}
            >
              <PersonRow
                name={u.name}
                id={u.userId}
                photoUrl={u.profilePhoto}
                subtitle={`Balance: ₹${u.totalDeposited.toLocaleString()}`}
              />
              <button
                type="button"
                className="text-xs text-brand-500 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserModal(u);
                }}
              >
                <Pencil className="w-3 h-3 inline" /> Edit
              </button>
            </button>
          ))}
        </div>

        {selected && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <PersonRow name={selected.name} id={selected.userId} photoUrl={selected.profilePhoto} />
              <p className="text-sm">
                Balance: <span className="text-brand-500">₹{selected.totalDeposited.toLocaleString()}</span>
              </p>
              {selected.email && <p className="text-sm text-slate-400">Email: {selected.email}</p>}
              {selected.aadharNumber && (
                <p className="text-sm text-slate-400">Aadhar: {selected.aadharNumber}</p>
              )}
              {selected.panNumber && (
                <p className="text-sm text-slate-400">PAN: {selected.panNumber}</p>
              )}
              {selected.dematNumber && (
                <p className="text-sm text-slate-400">Demat: {selected.dematNumber}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary text-sm" onClick={() => setMoneyModal(true)}>
                  <Banknote className="w-4 h-4 inline mr-1" /> Add money
                </button>
                <button type="button" className="btn-primary text-sm" onClick={() => setTradeModal(true)}>
                  <LineChart className="w-4 h-4 inline mr-1" /> Add trade
                </button>
              </div>
            </div>

            <div className="card space-y-3">
              <h4 className="font-medium flex items-center gap-1">
                <Wallet className="w-4 h-4" /> Withdrawal requests
              </h4>
              {userWithdrawals.length === 0 ? (
                <p className="text-sm text-slate-400">No withdrawal requests for this user.</p>
              ) : (
                <ul className="space-y-2">
                  {userWithdrawals.map((w) => (
                    <li key={w._id} className="text-sm border-b border-slate-700/50 pb-2 space-y-1">
                      <div className="flex justify-between">
                        <span>₹{w.amount.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${withdrawalStatusClass(w.status)}`}>
                          {withdrawalStatusLabel(w.status)}
                        </span>
                      </div>
                      {w.userNote && <p className="text-slate-500">User: {w.userNote}</p>}
                      {w.brokerRemark && <p className="text-slate-500">Remark: {w.brokerRemark}</p>}
                      {(w.status === "pending" || w.status === "on_hold") && (
                        <button
                          type="button"
                          className="text-brand-500 text-xs"
                          onClick={() => {
                            setReviewId(w._id);
                            setReviewForm({
                              status: w.status === "on_hold" ? "approved" : "approved",
                              brokerRemark: w.brokerRemark ?? "",
                            });
                          }}
                        >
                          Review request
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card space-y-3">
              <h4 className="font-medium">Trades</h4>
              <ul className="space-y-2">
                {trades.map((t) => (
                  <li
                    key={t._id}
                    className="flex justify-between items-start gap-2 text-sm border-b border-slate-700/50 pb-2"
                  >
                    <div className="min-w-0 flex-1">
                      <TradeCard trade={t} />
                      <p className="text-brand-500 mt-1">
                        P/L: {formatTradeAmount(computeTradePL(t), t.currency ?? "USD")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.buyAmount ?? t.amount} → {t.sellAmount ?? t.amount} · {t.side} {t.lots}
                      </p>
                    </div>
                    <button type="button" className="text-red-400 shrink-0" onClick={() => deleteTrade(t._id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {trades.length === 0 && <p className="text-slate-400 text-sm">No trades yet.</p>}
              </ul>
            </div>
          </div>
        )}
      </div>

      {userModal && (
        <UserFormModal
          user={userModal === "create" ? null : userModal}
          onClose={() => setUserModal(null)}
          onSave={saveUser}
        />
      )}

      {tradeModal && selected && (
        <Modal title={`New trade — ${formatPersonLabel(selected.name, selected.userId)}`} onClose={() => setTradeModal(false)} wide>
          <form onSubmit={saveTrade} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <input
              className="input-field"
              placeholder="Symbol / company (e.g. XAUUSDm)"
              required
              value={tradeForm.companyName}
              onChange={(e) => setTradeForm({ ...tradeForm, companyName: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Lots (e.g. 0.05)"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={tradeForm.lots}
              onChange={(e) => setTradeForm({ ...tradeForm, lots: e.target.value })}
            />
            <div>
              <label className="block text-xs text-slate-400 mb-1">Side</label>
              <select
                className="input-field"
                value={tradeForm.side}
                onChange={(e) => setTradeForm({ ...tradeForm, side: e.target.value as TradeSide })}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <input
              className="input-field"
              placeholder="Buy price / entry (USD)"
              type="number"
              min="0"
              step="any"
              required
              value={tradeForm.buyAmount}
              onChange={(e) => setTradeForm({ ...tradeForm, buyAmount: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Sell price / exit (USD)"
              type="number"
              min="0"
              step="any"
              required
              value={tradeForm.sellAmount}
              onChange={(e) => setTradeForm({ ...tradeForm, sellAmount: e.target.value })}
            />
            <div>
              <label className="block text-xs text-slate-400 mb-1">Currency</label>
              <select
                className="input-field"
                value={tradeForm.currency}
                onChange={(e) =>
                  setTradeForm({ ...tradeForm, currency: e.target.value as TradeCurrency })
                }
              >
                <option value="USD">US Dollar ($)</option>
                <option value="INR">Indian Rupee (₹)</option>
              </select>
            </div>
            <input
              className="input-field"
              placeholder="Notes (optional)"
              value={tradeForm.notes}
              onChange={(e) => setTradeForm({ ...tradeForm, notes: e.target.value })}
            />
            <ModalActions onCancel={() => setTradeModal(false)} />
          </form>
        </Modal>
      )}

      {moneyModal && selected && (
        <Modal
          title={`Add money — ${formatPersonLabel(selected.name, selected.userId)}`}
          onClose={() => setMoneyModal(false)}
        >
          <form onSubmit={addMoney} className="space-y-3">
            <input
              className="input-field"
              placeholder="Amount (₹)"
              type="number"
              min="1"
              required
              value={moneyForm.amount}
              onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Note (optional)"
              value={moneyForm.note}
              onChange={(e) => setMoneyForm({ ...moneyForm, note: e.target.value })}
            />
            <ModalActions onCancel={() => setMoneyModal(false)} />
          </form>
        </Modal>
      )}

      {reviewId && (
        <Modal title="Review withdrawal" onClose={() => setReviewId(null)}>
          <form onSubmit={reviewWithdrawal} className="space-y-3">
            <select
              className="input-field"
              value={reviewForm.status}
              onChange={(e) =>
                setReviewForm({
                  ...reviewForm,
                  status: e.target.value as WithdrawalRequest["status"],
                })
              }
            >
              <option value="approved">Approve</option>
              <option value="declined">Decline</option>
              <option value="on_hold">Hold</option>
            </select>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Remark for user"
              value={reviewForm.brokerRemark}
              onChange={(e) => setReviewForm({ ...reviewForm, brokerRemark: e.target.value })}
            />
            <ModalActions onCancel={() => setReviewId(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`card w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
        <h3 className="font-bold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="btn-primary flex-1">
        Save
      </button>
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user: PlatformUser | null;
  onClose: () => void;
  onSave: (e: React.FormEvent, form: Record<string, string>, id?: string) => void;
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    aadharNumber: user?.aadharNumber ?? "",
    panNumber: user?.panNumber ?? "",
    dematNumber: user?.dematNumber ?? "",
    password: "",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={(e) => onSave(e, { ...form, confirmPassword: form.password }, user?._id)}
        className="card w-full max-w-sm space-y-3 my-4"
      >
        <h3 className="font-bold">{user ? "Edit user" : "Create user"}</h3>
        {user && (
          <p className="text-sm text-brand-500">{formatPersonLabel(user.name, user.userId)}</p>
        )}
        <input
          className="input-field"
          placeholder="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Email (for login)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Aadhar (12 digits)"
          maxLength={12}
          required={!user}
          value={form.aadharNumber}
          onChange={(e) =>
            setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, "") })
          }
        />
        <input
          className="input-field"
          placeholder="PAN (e.g. ABCDE1234F)"
          maxLength={10}
          required={!user}
          pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}"
          title="5 letters, 4 digits, 1 letter — e.g. ABCDE1234F"
          value={form.panNumber}
          onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
        />
        <input
          className="input-field"
          placeholder="Demat number (12 digits)"
          maxLength={12}
          value={form.dematNumber}
          onChange={(e) =>
            setForm({ ...form, dematNumber: e.target.value.replace(/\D/g, "") })
          }
        />
        <PasswordInput
          placeholder={user ? "New password (optional)" : "Password"}
          required={!user}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
