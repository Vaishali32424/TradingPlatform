import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  LineChart,
  Banknote,
  Clock,
  Archive,
  Download,
} from "lucide-react";
import api from "../../api/client";
import type { PlatformUser, Trade, WithdrawalRequest } from "../../types";
import { withdrawalStatusClass, withdrawalStatusLabel } from "../../utils/displayName";
import { PasswordInput } from "../../components/PasswordInput";
import { PersonRow } from "../../components/PersonRow";
import { TradeCard } from "../../components/TradeCard";
import {
  formatTradeAmount,
  formatBuySellLine,
  computeTradePL,
  computePLFromPrices,
} from "../../utils/trade";
import type { TradeSide } from "../../types";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";
import { downloadStatementPdf } from "../../utils/statementPdf";
import { ModalShell } from "../../components/ModalShell";

type UserTab = "trades" | "history" | "withdrawals";

export default function BrokerUserManagement() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [tab, setTab] = useState<UserTab>("trades");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [historyTrades, setHistoryTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [userModal, setUserModal] = useState<"create" | PlatformUser | null>(null);
  const [tradeModal, setTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [moneyModal, setMoneyModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [balanceForm, setBalanceForm] = useState("");
  const [scheduleTradeId, setScheduleTradeId] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [tradeForm, setTradeForm] = useState({
    companyName: "",
    lots: "",
    side: "buy" as TradeSide,
    buyAmount: "",
    sellAmount: "",
    notes: "",
    scheduleEnabled: false,
    scheduledMoveAt: "",
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

  const loadTrades = (user: PlatformUser) =>
    api.get(`/broker/users/${user._id}/trades`).then((res) => setTrades(res.data));

  const loadHistory = (user: PlatformUser) =>
    api.get(`/broker/users/${user._id}/order-history`).then((res) => setHistoryTrades(res.data));

  useEffect(() => {
    loadUsers();
    loadWithdrawals();
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadTrades(selected);
    loadHistory(selected);
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
        toastSuccess("User updated");
      } else {
        payload.password = form.password;
        payload.confirmPassword = form.password;
        await api.post("/broker/users", payload);
        toastSuccess("User created");
      }
      setUserModal(null);
      loadUsers();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not save user"));
    }
  };

  const resetTradeForm = () => {
    setTradeForm({
      companyName: "",
      lots: "",
      side: "buy",
      buyAmount: "",
      sellAmount: "",
      notes: "",
      scheduleEnabled: false,
      scheduledMoveAt: "",
    });
    setEditingTrade(null);
  };

  const openNewTrade = () => {
    resetTradeForm();
    setTradeModal(true);
  };

  const openEditTrade = (t: Trade) => {
    setEditingTrade(t);
    setTradeForm({
      companyName: t.companyName ?? t.tradeName ?? "",
      lots: String(t.lots ?? 1),
      side: (t.side ?? "buy") as TradeSide,
      buyAmount: String(t.buyAmount ?? t.amount ?? ""),
      sellAmount: String(t.sellAmount ?? t.amount ?? ""),
      notes: t.notes ?? "",
      scheduleEnabled: false,
      scheduledMoveAt: "",
    });
    setTradeModal(true);
  };

  const saveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const body: Record<string, unknown> = {
        companyName: tradeForm.companyName.trim(),
        lots: Number(tradeForm.lots),
        side: tradeForm.side,
        buyAmount: Number(tradeForm.buyAmount),
        sellAmount: Number(tradeForm.sellAmount),
        currency: "USD",
        notes: tradeForm.notes.trim() || undefined,
      };
      if (editingTrade) {
        await api.put(`/broker/trades/${editingTrade._id}`, body);
        toastSuccess("Trade updated");
      } else {
        body.userId = selected.userId;
        if (tradeForm.scheduleEnabled && tradeForm.scheduledMoveAt) {
          body.scheduledMoveAt = new Date(tradeForm.scheduledMoveAt).toISOString();
        }
        await api.post("/broker/trades", body);
        toastSuccess("Trade added");
      }
      setTradeModal(false);
      resetTradeForm();
      loadTrades(selected);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, editingTrade ? "Could not update trade" : "Could not add trade"));
    }
  };

  const deleteUser = async () => {
    if (!selected || !confirm(`Deactivate user ${selected.name}? They will not be able to log in.`)) return;
    try {
      await api.delete(`/broker/users/${selected._id}`);
      toastSuccess("User deactivated");
      setSelected(null);
      loadUsers();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not delete user"));
    }
  };

  const saveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const amount = Number(balanceForm);
    if (!Number.isFinite(amount) || amount < 0) {
      toastError("Enter a valid balance");
      return;
    }
    try {
      const { data } = await api.put(`/broker/users/${selected._id}/balance`, {
        totalDeposited: amount,
      });
      toastSuccess(data.message ?? "Balance updated");
      setBalanceModal(false);
      loadUsers();
      const updated = await api.get("/broker/users");
      const u = updated.data.find((x: PlatformUser) => x._id === selected._id);
      if (u) setSelected(u);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not update balance"));
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
      toastSuccess(data.message ?? "Money added");
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

  const sendToHistory = async (tradeId: string) => {
    if (!selected || !confirm("Move this trade to order history? It stays in the user's balance.")) return;
    try {
      await api.post(`/broker/trades/${tradeId}/to-order-history`);
      toastSuccess("Sent to order history");
      loadTrades(selected);
      loadHistory(selected);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not archive trade"));
    }
  };

  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTradeId || !selected) return;
    try {
      await api.post(`/broker/trades/${scheduleTradeId}/schedule`, {
        scheduledMoveAt: new Date(scheduleAt).toISOString(),
      });
      toastSuccess("Trade scheduled for order history");
      setScheduleTradeId(null);
      setScheduleAt("");
      loadTrades(selected);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not schedule trade"));
    }
  };

  const clearSchedule = async (tradeId: string) => {
    if (!selected) return;
    try {
      await api.delete(`/broker/trades/${tradeId}/schedule`);
      toastSuccess("Schedule removed");
      loadTrades(selected);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not remove schedule"));
    }
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade permanently?")) return;
    try {
      await api.delete(`/broker/trades/${id}`);
      toastSuccess("Trade deleted");
      if (selected) loadTrades(selected);
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not delete trade"));
    }
  };

  const downloadHistoryPdf = async () => {
    if (!selected) return;
    try {
      const { data } = await api.get(`/broker/users/${selected._id}/order-history/statement`);
      downloadStatementPdf({
        title: "Order History Statement",
        subtitle: "Order history statement",
        accountName: data.user.name,
        ledger: data.ledger,
        positions: data.trades.map((t: Trade) => ({
          label: `${t.companyName ?? t.tradeName} · ${t.side} ${t.lots}`,
          buy: t.buyAmount ?? t.amount ?? 0,
          sell: t.sellAmount ?? t.amount ?? 0,
          pl: t.profitLoss ?? computeTradePL(t),
        })),
        filename: `order-history-${data.user.userId}.pdf`,
      });
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not download PDF"));
    }
  };

  const userWithdrawals = selected
    ? withdrawals.filter((w) => w.userId === selected.userId)
    : [];
  const pendingAll = withdrawals.filter((w) => w.status === "pending" || w.status === "on_hold");
  const usersWithPendingWithdrawal = new Set(
    withdrawals.filter((w) => w.status === "pending" || w.status === "on_hold").map((w) => w.userId)
  );

  const previewPL = computePLFromPrices(
    Number(tradeForm.buyAmount),
    Number(tradeForm.sellAmount)
  );

  const tabs: { id: UserTab; label: string }[] = [
    { id: "trades", label: `Trades (${trades.length})` },
    { id: "history", label: `History (${historyTrades.length})` },
    { id: "withdrawals", label: `Withdrawals (${userWithdrawals.length})` },
  ];

  return (
    <div className="page-container space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-lg font-bold">Users</h2>
        <button type="button" className="btn-primary text-sm flex items-center gap-1" onClick={() => setUserModal("create")}>
          <Plus className="w-4 h-4" /> Add user
        </button>
      </div>

      {pendingAll.length > 0 && (
        <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          {pendingAll.length} pending withdrawal(s)
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-3">
        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {users.map((u) => {
            const hasPending = usersWithPendingWithdrawal.has(u.userId);
            return (
              <button
                key={u._id}
                type="button"
                onClick={() => {
                  setSelected(u);
                  setTab(hasPending ? "withdrawals" : "trades");
                }}
                className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors relative ${
                  selected?._id === u._id
                    ? "border-brand-500 bg-brand-500/10"
                    : hasPending
                      ? "border-amber-500/50 bg-amber-500/5 hover:border-amber-500"
                      : "border-slate-700/50 hover:border-slate-600"
                }`}
              >
                {hasPending && (
                  <span
                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900"
                    title="Pending withdrawal"
                  />
                )}
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <PersonRow name={u.name} id={u.userId} photoUrl={u.profilePhoto} size="sm" />
                </div>
                <p className="text-xs text-brand-400 mt-1 tabular-nums">
                  ${u.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="card space-y-3 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <PersonRow name={selected.name} id={selected.userId} photoUrl={selected.profilePhoto} />
                <p className="text-sm text-brand-400 mt-1 tabular-nums">
                  Balance ${selected.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="btn-primary text-xs px-2.5 py-1.5" onClick={() => setMoneyModal(true)}>
                  <Banknote className="w-3.5 h-3.5 inline" /> Money
                </button>
                <button type="button" className="btn-primary text-xs px-2.5 py-1.5" onClick={openNewTrade}>
                  <LineChart className="w-3.5 h-3.5 inline" /> Trade
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs px-2.5 py-1.5"
                  onClick={() => {
                    setBalanceForm(String(selected.totalDeposited));
                    setBalanceModal(true);
                  }}
                >
                  <Banknote className="w-3.5 h-3.5 inline" /> Balance
                </button>
                <button type="button" className="btn-ghost text-xs px-2.5 py-1.5" onClick={() => setUserModal(selected)}>
                  <Pencil className="w-3.5 h-3.5 inline" /> Edit
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs px-2.5 py-1.5 text-red-400"
                  onClick={deleteUser}
                >
                  <Trash2 className="w-3.5 h-3.5 inline" /> Delete
                </button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-slate-700/50 pb-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-t whitespace-nowrap ${
                    tab === t.id ? "bg-brand-600/30 text-brand-300 font-medium" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "trades" && (
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                {trades.map((t) => (
                  <li
                    key={t._id}
                    className="flex items-start gap-2 text-sm border border-slate-700/40 rounded-lg p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <TradeCard trade={t} compact />
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{formatBuySellLine(t)}</p>
                      <p className="text-xs text-brand-400 mt-0.5">
                        P/L {formatTradeAmount(computeTradePL(t), "USD")}
                      </p>
                      {t.scheduledMoveAt && (
                        <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(t.scheduledMoveAt).toLocaleString()}
                          <button
                            type="button"
                            className="underline ml-1"
                            onClick={() => clearSchedule(t._id)}
                          >
                            Clear
                          </button>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit trade"
                        className="p-1.5 rounded bg-slate-700/50 text-slate-200 hover:bg-slate-600"
                        onClick={() => openEditTrade(t)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Send to order history"
                        className="p-1.5 rounded bg-slate-700/50 text-blue-300 hover:bg-slate-600"
                        onClick={() => sendToHistory(t._id)}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Schedule for order history"
                        className="p-1.5 rounded bg-slate-700/50 text-amber-300 hover:bg-slate-600"
                        onClick={() => {
                          setScheduleTradeId(t._id);
                          setScheduleAt("");
                        }}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="p-1.5 rounded bg-slate-700/50 text-red-400 hover:bg-slate-600"
                        onClick={() => deleteTrade(t._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
                {trades.length === 0 && (
                  <p className="text-slate-400 text-sm py-4 text-center">No active trades</p>
                )}
              </ul>
            )}

            {tab === "history" && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-ghost text-xs flex items-center gap-1"
                    disabled={historyTrades.length === 0}
                    onClick={downloadHistoryPdf}
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
                <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {historyTrades.map((t) => (
                    <li
                      key={t._id}
                      className="text-sm border border-slate-700/40 rounded-lg p-2.5 flex justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <TradeCard trade={t} compact />
                        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{formatBuySellLine(t)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Archived{" "}
                          {t.movedToHistoryAt
                            ? new Date(t.movedToHistoryAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <span className="text-brand-400 text-xs shrink-0">
                        {formatTradeAmount(computeTradePL(t), t.currency ?? "USD")}
                      </span>
                    </li>
                  ))}
                  {historyTrades.length === 0 && (
                    <p className="text-slate-400 text-sm py-4 text-center">No order history yet</p>
                  )}
                </ul>
              </div>
            )}

            {tab === "withdrawals" && (
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                {userWithdrawals.map((w) => (
                  <li key={w._id} className="text-sm border border-slate-700/40 rounded-lg p-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium">${w.amount.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${withdrawalStatusClass(w.status)}`}>
                        {withdrawalStatusLabel(w.status)}
                      </span>
                    </div>
                    {(w.status === "pending" || w.status === "on_hold") && (
                      <button
                        type="button"
                        className="text-brand-500 text-xs mt-2"
                        onClick={() => {
                          setReviewId(w._id);
                          setReviewForm({ status: "approved", brokerRemark: w.brokerRemark ?? "" });
                        }}
                      >
                        Review
                      </button>
                    )}
                  </li>
                ))}
                {userWithdrawals.length === 0 && (
                  <p className="text-slate-400 text-sm py-4 text-center">No withdrawals</p>
                )}
              </ul>
            )}
          </div>
        ) : (
          <div className="card flex items-center justify-center text-slate-400 text-sm min-h-[200px]">
            Select a user
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
        <ModalShell
          title={editingTrade ? `Edit trade — ${selected.name}` : `New trade — ${selected.name}`}
          onClose={() => {
            setTradeModal(false);
            resetTradeForm();
          }}
          wide
        >
          <form onSubmit={saveTrade} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <input
              className="input-field"
              placeholder="Symbol (e.g. XAUUSDm)"
              required
              value={tradeForm.companyName}
              onChange={(e) => setTradeForm({ ...tradeForm, companyName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lots</label>
                <input
                  className="input-field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={tradeForm.lots}
                  onChange={(e) => setTradeForm({ ...tradeForm, lots: e.target.value })}
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Buying price (USD)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={tradeForm.buyAmount}
                  onChange={(e) => setTradeForm({ ...tradeForm, buyAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Selling price (USD)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={tradeForm.sellAmount}
                  onChange={(e) => setTradeForm({ ...tradeForm, sellAmount: e.target.value })}
                />
              </div>
            </div>
            {tradeForm.buyAmount && tradeForm.sellAmount && (
              <p
                className={`text-sm font-semibold tabular-nums ${
                  previewPL >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {previewPL >= 0 ? "Profit" : "Loss"}: {formatTradeAmount(Math.abs(previewPL), "USD")}
                <span className="text-slate-500 font-normal text-xs ml-1">
                  (sell − buy)
                </span>
              </p>
            )}
            {!editingTrade && (
              <>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={tradeForm.scheduleEnabled}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, scheduleEnabled: e.target.checked })
                    }
                  />
                  Schedule move to order history
                </label>
                {tradeForm.scheduleEnabled && (
                  <input
                    className="input-field"
                    type="datetime-local"
                    required
                    value={tradeForm.scheduledMoveAt}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, scheduledMoveAt: e.target.value })
                    }
                  />
                )}
              </>
            )}
            <ModalActions
              onCancel={() => {
                setTradeModal(false);
                resetTradeForm();
              }}
              submitLabel={editingTrade ? "Update" : "Save"}
            />
          </form>
        </ModalShell>
      )}

      {balanceModal && selected && (
        <ModalShell title={`Set balance — ${selected.name}`} onClose={() => setBalanceModal(false)}>
          <form onSubmit={saveBalance} className="space-y-3">
            <p className="text-xs text-slate-400">Set the user&apos;s wallet balance directly (USD).</p>
            <input
              className="input-field"
              placeholder="Balance (USD)"
              type="number"
              min="0"
              step="any"
              required
              value={balanceForm}
              onChange={(e) => setBalanceForm(e.target.value)}
            />
            <ModalActions onCancel={() => setBalanceModal(false)} submitLabel="Update balance" />
          </form>
        </ModalShell>
      )}

      {moneyModal && selected && (
        <ModalShell title={`Add funds — ${selected.name}`} onClose={() => setMoneyModal(false)}>
          <form onSubmit={addMoney} className="space-y-3">
            <input
              className="input-field"
              placeholder="Amount (USD)"
              type="number"
              min="0.01"
              step="any"
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
        </ModalShell>
      )}

      {scheduleTradeId && (
        <ModalShell title="Schedule order history" onClose={() => setScheduleTradeId(null)}>
          <form onSubmit={saveSchedule} className="space-y-3">
            <p className="text-xs text-slate-400">
              Trade stays in portfolio until this time, then moves to the user&apos;s order history.
            </p>
            <input
              className="input-field"
              type="datetime-local"
              required
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
            <ModalActions onCancel={() => setScheduleTradeId(null)} submitLabel="Schedule" />
          </form>
        </ModalShell>
      )}

      {reviewId && (
        <ModalShell title="Review withdrawal" onClose={() => setReviewId(null)}>
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
              placeholder="Remark"
              value={reviewForm.brokerRemark}
              onChange={(e) => setReviewForm({ ...reviewForm, brokerRemark: e.target.value })}
            />
            <ModalActions onCancel={() => setReviewId(null)} />
          </form>
        </ModalShell>
      )}
    </div>
  );
}

function ModalActions({
  onCancel,
  submitLabel = "Save",
}: {
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="btn-primary flex-1">
        {submitLabel}
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
    <ModalShell title={user ? "Edit user" : "Create user"} onClose={onClose} wide>
      <form
        onSubmit={(e) => onSave(e, { ...form, confirmPassword: form.password }, user?._id)}
        className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
      >
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
          placeholder="Email"
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
          placeholder="PAN"
          maxLength={10}
          required={!user}
          value={form.panNumber}
          onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
        />
        <PasswordInput
          placeholder={user ? "New password (optional)" : "Password"}
          required={!user}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <ModalActions onCancel={onClose} />
      </form>
    </ModalShell>
  );
}
