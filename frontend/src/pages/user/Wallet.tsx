import { useEffect, useState } from "react";
import api from "../../api/client";
import type { Transaction, WithdrawalRequest } from "../../types";
import { withdrawalStatusClass, withdrawalStatusLabel } from "../../utils/displayName";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";

export default function UserWallet() {
  const [balance, setBalance] = useState(0);
  const [credits, setCredits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get("/user/wallet").then((res) => {
      setBalance(res.data.balance);
      setCredits(res.data.credits);
      setWithdrawals(res.data.withdrawals);
    });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const sendWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/user/withdrawals", {
        amount: Number(amount),
        userNote: userNote.trim() || undefined,
      });
      toastSuccess(data.message ?? "Withdrawal request sent");
      setAmount("");
      setUserNote("");
      await load();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not send withdrawal request"));
    } finally {
      setSubmitting(false);
    }
  };

  const hasOpenRequest = withdrawals.some((w) =>
    ["pending", "on_hold"].includes(w.status)
  );

  if (loading) return <div className="page-container animate-pulse">Loading...</div>;

  return (
    <div className="page-container space-y-6">
      <h2 className="text-xl font-bold">Wallet</h2>

      <div className="card max-w-md">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Available balance</p>
        <p className="text-3xl font-bold text-brand-500 mt-1">₹{balance.toLocaleString()}</p>
        <p className="text-sm text-slate-400 mt-2">
          Funds are added by your broker and appear below.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold">Money added by broker</h3>
        {credits.length === 0 ? (
          <p className="text-sm text-slate-400">No credits yet. Contact your broker to add funds.</p>
        ) : (
          <ul className="space-y-2">
            {credits.map((c) => (
              <li key={c._id} className="card text-sm flex justify-between gap-2">
                <div>
                  <p className="font-medium text-emerald-400">+ ₹{c.amount.toLocaleString()}</p>
                  {c.addedByBrokerName && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      Added by {c.addedByBrokerName}
                    </p>
                  )}
                  {c.note && <p className="text-slate-500 text-xs">{c.note}</p>}
                </div>
                <span className="text-slate-500 text-xs shrink-0">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card max-w-md space-y-4">
        <h3 className="font-semibold">Withdraw money</h3>
        <p className="text-sm text-slate-400">
          Submit a request to your broker. Track status and remarks below.
        </p>
        <form onSubmit={sendWithdrawal} className="space-y-3">
          <input
            className="input-field"
            type="number"
            min="1"
            max={balance}
            placeholder="Amount (₹)"
            required
            disabled={hasOpenRequest || balance <= 0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Note for broker (optional)"
            disabled={hasOpenRequest || balance <= 0}
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || hasOpenRequest || balance <= 0}
          >
            {submitting ? "Sending..." : "Send withdrawal request"}
          </button>
          {hasOpenRequest && (
            <p className="text-xs text-amber-400">
              You have an open request. Wait for broker action before submitting another.
            </p>
          )}
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Withdrawal requests</h3>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-slate-400">No withdrawal requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {withdrawals.map((w) => (
              <li key={w._id} className="card text-sm space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium">₹{w.amount.toLocaleString()}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${withdrawalStatusClass(w.status)}`}
                  >
                    {withdrawalStatusLabel(w.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(w.createdAt).toLocaleString()}
                </p>
                {w.userNote && (
                  <p>
                    <span className="text-slate-500">Your note:</span> {w.userNote}
                  </p>
                )}
                {w.brokerRemark && (
                  <p>
                    <span className="text-slate-500">Broker remark:</span> {w.brokerRemark}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
