import type { Trade } from "../types";
import { computeTradePL, formatTradeAmount, formatTradeDetails, formatTradeSummary } from "../utils/trade";

export function TradeCard({ trade, compact }: { trade: Trade; compact?: boolean }) {
  const currency = trade.currency ?? "USD";
  const pl = computeTradePL(trade);

  if (compact) {
    return (
      <div className="text-sm space-y-0.5">
        <p className="font-medium">{formatTradeSummary(trade)}</p>
        <p className="text-brand-500">
          {trade.side} {trade.lots} · P/L {formatTradeAmount(pl, currency)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="font-semibold">{formatTradeSummary(trade)}</p>
      <ul className="text-xs text-slate-400 space-y-0.5">
        {formatTradeDetails(trade).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 capitalize">{trade.status}</p>
    </div>
  );
}
