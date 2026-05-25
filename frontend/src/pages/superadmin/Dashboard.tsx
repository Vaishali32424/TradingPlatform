import { useEffect, useState } from "react";
import api from "../../api/client";
import { PersonRow } from "../../components/PersonRow";
import { TradeCard } from "../../components/TradeCard";
import type { BrokerActivity, Trade } from "../../types";
import { formatTradeAmount } from "../../utils/trade";
import { IndianRupee, Users, Building2 } from "lucide-react";

export default function SuperAdminDashboard() {
  const [data, setData] = useState<{
    totalPlatformMoney: number;
    activeBrokers: number;
    activeUsers: number;
    brokerActivity: BrokerActivity[];
    recentTrades: Trade[];
  } | null>(null);

  useEffect(() => {
    api.get("/superadmin/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="page-container animate-pulse text-slate-400">Loading dashboard...</div>;

  return (
    <div className="page-container space-y-6">
      <h2 className="text-xl font-bold">Platform overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={IndianRupee} label="Total money on platform" value={`₹${data.totalPlatformMoney.toLocaleString()}`} />
        <StatCard icon={Building2} label="Active brokers" value={String(data.activeBrokers)} />
        <StatCard icon={Users} label="Active users" value={String(data.activeUsers)} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Recent broker activity</h3>
        {data.brokerActivity.length === 0 ? (
          <p className="text-slate-400 text-sm">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.brokerActivity.map((a, i) => (
              <li key={i} className="text-sm border-b border-slate-700/50 pb-3 last:border-0 space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-300 capitalize">{a.action.replace(/_/g, " ")}</span>
                  <span className="text-slate-500 shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-brand-500">
                  Broker: {a.brokerName ?? a.actorId} ({a.brokerDisplayId ?? a.actorId})
                </p>
                {a.userName && a.userId && (
                  <p className="text-slate-400">
                    User: {a.userName} ({a.userId})
                  </p>
                )}
                {a.metadata?.amount != null && !a.metadata?.trade && (
                  <p className="text-slate-400">Amount: ₹{a.metadata.amount.toLocaleString()}</p>
                )}
                {a.metadata?.trade && (
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
                    <p className="font-medium text-white">Trade details</p>
                    <p>Company: {a.metadata.trade.companyName}</p>
                    <p>Expiry: {new Date(a.metadata.trade.expiryDate).toLocaleDateString()}</p>
                    <p>
                      Strike: {a.metadata.trade.strikePrice} ({a.metadata.trade.optionType.toUpperCase()})
                    </p>
                    <p>Lots: {a.metadata.trade.lots}</p>
                    <p>
                      {a.metadata.trade.side === "buy" ? "Buy" : "Sell"}:{" "}
                      {formatTradeAmount(
                        a.metadata.trade.amount,
                        a.metadata.trade.currency as "INR" | "USD"
                      )}
                    </p>
                    <p>
                      Currency: {a.metadata.trade.currency === "USD" ? "US Dollar ($)" : "Indian Rupee (₹)"}
                    </p>
                  </div>
                )}
                {a.details && !a.metadata?.trade && (
                  <p className="text-slate-500">{a.details}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Recent trades</h3>
        {data.recentTrades.length === 0 ? (
          <p className="text-slate-400 text-sm">No trades yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.recentTrades.map((t) => (
              <li key={t._id} className="border-b border-slate-700/50 pb-4 last:border-0">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {t.userName && (
                      <PersonRow
                        name={t.userName}
                        id={t.userId}
                        photoUrl={t.userProfilePhoto}
                        size="sm"
                      />
                    )}
                    {t.brokerName && t.brokerId && (
                      <PersonRow
                        name={t.brokerName}
                        id={t.brokerId}
                        photoUrl={t.brokerProfilePhoto}
                        size="sm"
                        subtitle="Broker"
                      />
                    )}
                    <TradeCard trade={t} />
                  </div>
                  <p className="text-brand-500 font-semibold shrink-0">
                    {formatTradeAmount(t.amount, t.currency ?? "INR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof IndianRupee; label: string; value: string }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="p-3 rounded-xl bg-brand-600/15 text-brand-500">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}
