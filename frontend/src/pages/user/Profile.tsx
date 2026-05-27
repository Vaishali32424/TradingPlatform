import { useEffect, useState } from "react";
import {
  UserCircle,
  Wallet,
  ArrowDownToLine,
  PlusCircle,
  Phone,
  Users,
  ChevronRight,
  X,
} from "lucide-react";
import api from "../../api/client";
import { ProfilePhotoEditor } from "../../components/ProfilePhotoEditor";
import type { PlatformUser, WithdrawalRequest } from "../../types";
import { formatPersonLabel } from "../../utils/displayName";
import { withdrawalStatusClass, withdrawalStatusLabel } from "../../utils/displayName";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";

export default function UserProfile() {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [brokerPhone, setBrokerPhone] = useState("");
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [amount, setAmount] = useState("");
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [profileRes, walletRes] = await Promise.all([
      api.get("/user/profile"),
      api.get("/user/wallet"),
    ]);
    setUser(profileRes.data.user);
    setBrokerPhone(profileRes.data.brokerPhone ?? "");
    setBalance(walletRes.data.balance);
    setWithdrawals(walletRes.data.withdrawals);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const showFundError = () => toastError("Something went wrong. Please try again later.");

  const sendWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toastError("Enter a valid amount");
      return;
    }
    if (amt > balance) {
      toastError(`Amount cannot exceed available balance ($${balance.toLocaleString()})`);
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/user/withdrawals", {
        amount: amt,
        userNote: userNote.trim() || undefined,
      });
      toastSuccess(data.message ?? "Withdrawal request sent");
      setAmount("");
      setUserNote("");
      setShowWithdraw(false);
      await load();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not send withdrawal request"));
    } finally {
      setSubmitting(false);
    }
  };

  const hasOpenRequest = withdrawals.some((w) => ["pending", "on_hold"].includes(w.status));

  if (!user) return <div className="px-4 py-8 animate-pulse text-slate-500">Loading...</div>;

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Wallet balance</p>
        <p className="text-3xl font-bold text-blue-600 tabular-nums">
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {/* <p className="text-xs text-slate-400 mt-1">Credited by your broker</p> */}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowWithdraw(true)}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors"
        >
          <ArrowDownToLine className="w-8 h-8 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">Withdrawal</span>
        </button>
        <button
          type="button"
          onClick={showFundError}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors"
        >
          <PlusCircle className="w-8 h-8 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">Add funds</span>
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="px-4 pt-4 pb-2 font-semibold text-slate-800 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-blue-600" />
          My profile
        </h3>
        <div className="px-4 pb-4 flex flex-col items-center">
          <ProfilePhotoEditor
            name={user.name}
            photoUrl={user.profilePhoto}
            uploadUrl="/user/profile/photo"
            onUpdated={(photo) => setUser((u) => (u ? { ...u, profilePhoto: photo } : u))}
          />
        </div>
        <dl className="divide-y divide-slate-100 text-sm">
          <Row label="Name" value={formatPersonLabel(user.name, user.userId)} />
          {user.aadharMasked && <Row label="Aadhar" value={user.aadharMasked} mono />}
          {user.panMasked && <Row label="PAN" value={user.panMasked} mono />}
          {user.dematNumber && <Row label="Demat no." value={user.dematNumber} mono />}
          {user.email && <Row label="Email" value={user.email} />}
          {user.phone && <Row label="Phone" value={user.phone} />}
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50"
          onClick={() => setShowAbout(true)}
        >
          <Phone className="w-5 h-5 text-blue-600" />
          <span className="flex-1 text-left font-medium text-slate-800">About us</span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50"
          onClick={showFundError}
        >
          <Users className="w-5 h-5 text-blue-600" />
          <span className="flex-1 text-left font-medium text-slate-800">Invite friends</span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </section>

      {withdrawals.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Withdrawal history
          </h4>
          <ul className="space-y-2">
            {withdrawals.slice(0, 5).map((w) => (
              <li key={w._id} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="font-medium">${w.amount.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${withdrawalStatusClass(w.status)}`}>
                  {withdrawalStatusLabel(w.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center p-4">
          <form
            onSubmit={sendWithdrawal}
            className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Withdraw funds</h3>
              <button type="button" onClick={() => setShowWithdraw(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Available: <strong className="text-blue-600">${balance.toLocaleString()}</strong>
            </p>
            <input
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              type="number"
              min="1"
              max={balance}
              placeholder="Amount (USD)"
              required
              disabled={hasOpenRequest || balance <= 0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900"
              placeholder="Note for broker (optional)"
              disabled={hasOpenRequest || balance <= 0}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
            />
            {hasOpenRequest && (
              <p className="text-xs text-amber-600">You already have a pending request.</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
              disabled={submitting || hasOpenRequest || balance <= 0}
            >
              {submitting ? "Sending..." : "Send request"}
            </button>
          </form>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-bold text-lg">About us</h3>
              <button type="button" onClick={() => setShowAbout(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              FOREX PLUS connects you with your licensed broker for trading, funding, and support.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Broker contact</p>
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                {brokerPhone || "Not available"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium text-slate-900 text-right ${mono ? "font-mono tracking-wide" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
