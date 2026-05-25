import { useEffect, useState } from "react";
import api from "../../api/client";
import type { WithdrawalRequest } from "../../types";
import { PersonRow } from "../../components/PersonRow";
import {
  withdrawalStatusClass,
  withdrawalStatusLabel,
} from "../../utils/displayName";
import type { PlatformUser } from "../../types";
import { getApiErrorMessage, toastError, toastSuccess } from "../../utils/toast";

export default function BrokerWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: "approved" as WithdrawalRequest["status"],
    brokerRemark: "",
  });
  const [filter, setFilter] = useState<"all" | "pending" | "on_hold">("all");

  const load = () =>
    Promise.all([
      api.get("/broker/withdrawals"),
      api.get("/broker/users"),
    ]).then(([wRes, uRes]) => {
      setWithdrawals(wRes.data);
      setUsers(uRes.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const userPhotoMap = Object.fromEntries(users.map((u) => [u.userId, u.profilePhoto]));

  const reviewWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewId) return;
    try {
      const { data } = await api.put(`/broker/withdrawals/${reviewId}`, reviewForm);
      toastSuccess(data.message ?? "Withdrawal updated");
      setReviewId(null);
      setReviewForm({ status: "approved", brokerRemark: "" });
      load();
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not update withdrawal"));
    }
  };

  const filtered = withdrawals.filter((w) => {
    if (filter === "pending") return w.status === "pending";
    if (filter === "on_hold") return w.status === "on_hold";
    return true;
  });

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="page-container space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl font-bold">Withdrawal requests</h2>
        {pendingCount > 0 && (
          <span className="text-sm text-amber-400">{pendingCount} pending</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "on_hold"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? "btn-primary text-sm" : "btn-ghost text-sm"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "pending" ? "Pending" : "On hold"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 animate-pulse">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="card">
          <p className="text-sm text-slate-400">No withdrawal requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <div key={w._id} className="card space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <PersonRow
                    name={w.userName}
                    id={w.userId}
                    photoUrl={userPhotoMap[w.userId]}
                    size="sm"
                  />
                  <p className="text-lg font-semibold text-brand-500 mt-2">
                    ₹{w.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(w.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${withdrawalStatusClass(w.status)}`}
                >
                  {withdrawalStatusLabel(w.status)}
                </span>
              </div>
              {w.userNote && <p className="text-sm text-slate-400">User note: {w.userNote}</p>}
              {w.brokerRemark && (
                <p className="text-sm text-slate-400">Your remark: {w.brokerRemark}</p>
              )}
              {(w.status === "pending" || w.status === "on_hold") && (
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => {
                    setReviewId(w._id);
                    setReviewForm({
                      status: "approved",
                      brokerRemark: w.brokerRemark ?? "",
                    });
                  }}
                >
                  Review request
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={reviewWithdrawal} className="card w-full max-w-sm space-y-3">
            <h3 className="font-bold">Review withdrawal</h3>
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
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setReviewId(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
