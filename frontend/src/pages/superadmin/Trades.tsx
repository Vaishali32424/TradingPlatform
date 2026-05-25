import { useEffect, useState } from "react";
import api from "../../api/client";
import type { Trade } from "../../types";
import { formatTradeAmount, formatBuySellLine, computeTradePL } from "../../utils/trade";

export default function SuperAdminTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/superadmin/trades").then((res) => {
      setTrades(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page-container space-y-4">
      <h2 className="text-lg font-bold">All trades</h2>
      {loading ? (
        <p className="text-slate-400 animate-pulse text-sm">Loading...</p>
      ) : trades.length === 0 ? (
        <p className="text-slate-400 text-sm">No trades yet.</p>
      ) : (
        <ul className="card divide-y divide-slate-700/40 p-0 overflow-hidden">
          {trades.map((t) => {
            const pl = computeTradePL(t);
            const when = new Date(t.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li
                key={t._id}
                className="px-4 py-2.5 text-xs hover:bg-slate-800/30 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
              >
                <span className="text-slate-500 shrink-0">{when}</span>
                <span className="text-brand-400">{t.brokerName ?? "—"}</span>
                <span className="text-slate-600">→</span>
                <span className="text-slate-300">{t.userName ?? t.userId}</span>
                <span className="text-slate-600">·</span>
                <span className="font-medium text-slate-200">
                  {t.companyName ?? t.tradeName}
                  {t.side ? ` ${t.side}` : ""}
                  {t.lots != null ? ` ${t.lots}` : ""}
                </span>
                <span className="text-slate-500 tabular-nums">{formatBuySellLine(t)}</span>
                <span
                  className={`ml-auto font-semibold tabular-nums ${
                    pl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatTradeAmount(pl, "USD")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
