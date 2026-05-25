import { useEffect, useState } from "react";
import api from "../../api/client";
import type { BrokerActivity, Trade } from "../../types";
import { formatTradeAmount, formatBuySellLine, computeTradePL } from "../../utils/trade";
import { DollarSign, Users, Building2, Activity } from "lucide-react";

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

  if (!data) return <div className="page-container animate-pulse text-slate-400">Loading...</div>;

  return (
    <div className="page-container space-y-4">
      <h2 className="text-lg font-bold">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={DollarSign}
          label="Platform funds"
          value={`$${data.totalPlatformMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <StatCard icon={Building2} label="Brokers" value={String(data.activeBrokers)} />
        <StatCard icon={Users} label="Users" value={String(data.activeUsers)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <section className="card">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" />
            Recent activity
          </h3>
          {data.brokerActivity.length === 0 ? (
            <p className="text-slate-400 text-xs">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-slate-700/40 max-h-[320px] overflow-y-auto">
              {data.brokerActivity.slice(0, 12).map((a, i) => (
                <li key={i} className="py-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-200 capitalize">
                      {a.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-slate-500 shrink-0">
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5">
                    Broker: <span className="text-slate-300">{a.brokerName ?? a.actorId}</span>
                    {a.userName && (
                      <>
                        {" "}
                        · User: <span className="text-slate-300">{a.userName}</span>
                      </>
                    )}
                  </p>
                  {a.metadata?.amount != null && !a.metadata?.trade && (
                    <p className="text-brand-400 mt-0.5">${a.metadata.amount.toLocaleString()}</p>
                  )}
                  {a.metadata?.trade && (
                    <p className="text-slate-500 mt-0.5">
                      {a.metadata.trade.companyName} · {a.metadata.trade.side}{" "}
                      {a.metadata.trade.lots} lots
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="font-semibold text-sm mb-2">Recent trades</h3>
          {data.recentTrades.length === 0 ? (
            <p className="text-slate-400 text-xs">No trades yet.</p>
          ) : (
            <ul className="divide-y divide-slate-700/40 max-h-[320px] overflow-y-auto">
              {data.recentTrades.slice(0, 10).map((t) => {
                const pl = computeTradePL(t);
                return (
                  <li key={t._id} className="py-2 text-xs space-y-0.5">
                    <p className="text-slate-200">
                      <span className="text-brand-400">{t.brokerName ?? "Broker"}</span>
                      <span className="text-slate-500"> → </span>
                      <span>{t.userName ?? "User"}</span>
                      <span className="text-slate-500"> · </span>
                      <span className="font-medium">{t.companyName ?? t.tradeName}</span>
                    </p>
                    <p className="text-slate-500 tabular-nums">{formatBuySellLine(t)}</p>
                    <p className={`font-semibold ${pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      P/L {formatTradeAmount(pl, "USD")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className="p-2 rounded-lg bg-brand-600/15 text-brand-500">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
