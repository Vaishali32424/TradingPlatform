import { useEffect, useState } from "react";
import { Copy, IndianRupee, Users, Wallet } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { formatPersonLabel } from "../../utils/displayName";
import { toastSuccess } from "../../utils/toast";

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    totalReceived: number;
    userCount: number;
    pendingWithdrawals: number;
    brokerId: string;
    signupLink: string;
  } | null>(null);

  useEffect(() => {
    api.get("/broker/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="page-container animate-pulse text-slate-400">Loading...</div>;

  return (
    <div className="page-container space-y-6">
      <h2 className="text-xl font-bold">Broker dashboard</h2>
      {user && (
        <p className="text-sm text-slate-400">{formatPersonLabel(user.name, user.loginId)}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex gap-4">
          <IndianRupee className="w-8 h-8 text-brand-500" />
          <div>
            <p className="text-slate-400 text-sm">Money received</p>
            <p className="text-2xl font-bold">₹{data.totalReceived.toLocaleString()}</p>
          </div>
        </div>
        <div className="card flex gap-4">
          <Users className="w-8 h-8 text-brand-500" />
          <div>
            <p className="text-slate-400 text-sm">Your users</p>
            <p className="text-2xl font-bold">{data.userCount}</p>
          </div>
        </div>
        <div className="card flex gap-4">
          <Wallet className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-slate-400 text-sm">Pending withdrawals</p>
            <p className="text-2xl font-bold">{data.pendingWithdrawals}</p>
          </div>
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-slate-400 mb-2">Your broker account</p>
        <p className="font-mono text-brand-500">{formatPersonLabel(user?.name ?? "", data.brokerId)}</p>
        <p className="text-sm text-slate-400 mt-4 mb-2">User signup link (share once — same forever)</p>
        <div className="flex gap-2">
          <input className="input-field text-xs" readOnly value={data.signupLink} />
          <button
            type="button"
            className="btn-primary shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(data.signupLink);
              toastSuccess("Signup link copied");
            }}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
