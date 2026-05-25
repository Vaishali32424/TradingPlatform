import { useEffect, useState } from "react";
import { Menu, ArrowUpDown, FilePlus } from "lucide-react";
import api from "../../api/client";
import type { Trade } from "../../types";
import { computeTradePL } from "../../utils/trade";

type PortfolioSummary = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  totalPL: number;
  currency: string;
};

type PortfolioResponse = {
  trades: (Trade & { profitLoss?: number; buyAmount?: number; sellAmount?: number })[];
  summary: PortfolioSummary;
};

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1.5">
      <span className="text-slate-600 shrink-0">{label}</span>
      <span className="flex-1 border-b border-dotted border-slate-300 min-w-[20px]" />
      <span className="font-medium text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

export default function UserPortfolio() {
  const [data, setData] = useState<PortfolioResponse | null>(null);

  useEffect(() => {
    api.get("/user/portfolio").then((res) => setData(res.data));
    const id = setInterval(() => {
      api.get("/user/portfolio").then((res) => setData(res.data));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="px-4 py-8 animate-pulse text-slate-500 text-center">Loading portfolio...</div>
    );
  }

  const { trades, summary } = data;
  const totalPL = summary.totalPL;
  const plPositive = totalPL >= 0;

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button type="button" className="p-2 text-slate-600" aria-label="Menu">
          <Menu className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-slate-800">Trade</p>
          <p className={`text-xl font-bold tabular-nums ${plPositive ? "text-blue-600" : "text-red-500"}`}>
            {plPositive ? "" : "-"}
            {fmt(Math.abs(totalPL))} USD
          </p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="p-2 text-slate-600" aria-label="Sort">
            <ArrowUpDown className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-slate-600" aria-label="Add">
            <FilePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white px-4 py-3 border-b border-slate-100">
        <SummaryRow label="Balance" value={fmt(summary.balance)} />
        <SummaryRow label="Equity" value={fmt(summary.equity)} />
        <SummaryRow label="Margin" value={fmt(summary.margin)} />
        <SummaryRow label="Free margin" value={fmt(summary.freeMargin)} />
        <SummaryRow label="Margin Level (%)" value={fmt(summary.marginLevel)} />
      </div>

      <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Positions</span>
        <span className="text-slate-400 text-lg leading-none">⋯</span>
      </div>

      <div className="bg-white divide-y divide-slate-100">
        {trades.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500 text-sm">
            No positions yet. Your broker will add trades here.
          </p>
        ) : (
          trades.map((t) => {
            const buy = t.buyAmount ?? t.amount ?? 0;
            const sell = t.sellAmount ?? t.amount ?? 0;
            const pl = t.profitLoss ?? computeTradePL(t);
            const plUp = pl >= 0;
            const lots = t.lots ?? 1;
            return (
              <div key={t._id} className="px-4 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-[15px] leading-tight">
                    {t.companyName ?? t.tradeName ?? "—"}
                    <span className="text-blue-600 font-semibold">
                      , {t.side ?? "buy"} {lots}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {fmt(buy)} → {fmt(sell)}
                  </p>
                </div>
                <p
                  className={`text-base font-bold tabular-nums shrink-0 ${
                    plUp ? "text-blue-600" : "text-red-500"
                  }`}
                >
                  {plUp ? "" : "-"}
                  {fmt(Math.abs(pl))}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
