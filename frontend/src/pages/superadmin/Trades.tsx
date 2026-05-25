import { useEffect, useState } from "react";
import api from "../../api/client";
import { PersonRow } from "../../components/PersonRow";
import { TradeCard } from "../../components/TradeCard";
import type { Trade } from "../../types";
import { formatTradeAmount } from "../../utils/trade";

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
      <h2 className="text-xl font-bold">All trades</h2>
      {loading ? (
        <p className="text-slate-400 animate-pulse">Loading...</p>
      ) : trades.length === 0 ? (
        <p className="text-slate-400">No trades yet.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((t) => (
            <div key={t._id} className="card space-y-3">
              <div className="flex flex-wrap gap-4">
                {t.userName && (
                  <PersonRow name={t.userName} id={t.userId} photoUrl={t.userProfilePhoto} size="sm" />
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
              </div>
              <div className="flex justify-between items-start gap-3">
                <TradeCard trade={t} />
                <p className="text-lg font-bold text-brand-500 shrink-0">
                  {formatTradeAmount(t.amount, t.currency ?? "INR")}
                </p>
              </div>
              <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
