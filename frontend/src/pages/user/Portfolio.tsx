import { useEffect, useState } from "react";
import { Menu, ArrowUpDown, Download, X, History, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import type { Trade } from "../../types";
import { computeTradePL } from "../../utils/trade";
import { downloadStatementPdf } from "../../utils/statementPdf";
import { getApiErrorMessage, toastError } from "../../utils/toast";
import { ForexWordmark } from "../../components/ForexWordmark";
import { useAuth } from "../../context/AuthContext";

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

type LedgerRow = {
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
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
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = () => api.get("/user/portfolio").then((res) => setData(res.data));

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { data: stmt } = await api.get("/user/portfolio/statement");
      downloadStatementPdf({
        title: "Portfolio Account Statement",
        subtitle: "Balance sheet — deposits, positions & running balance",
        accountName: stmt.user.name,
        ledger: stmt.ledger as LedgerRow[],
        summary: [
          { label: "Cash balance", value: `${fmt(stmt.summary.balance)} ${stmt.summary.currency}` },
          { label: "Total P/L", value: fmt(stmt.summary.totalPL) },
          { label: "Equity", value: `${fmt(stmt.summary.equity)} ${stmt.summary.currency}` },
        ],
        positions: (stmt.trades as Trade[]).map((t) => ({
          label: `${t.companyName ?? t.tradeName} · ${t.side} ${t.lots}`,
          buy: t.buyAmount ?? t.amount ?? 0,
          sell: t.sellAmount ?? t.amount ?? 0,
          pl: t.profitLoss ?? computeTradePL(t),
        })),
        filename: `portfolio-statement-${stmt.user.userId}.pdf`,
      });
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not download statement"));
    } finally {
      setDownloading(false);
    }
  };

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
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="flex-1 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="w-72 max-w-[85vw] bg-white h-full shadow-xl flex flex-col">
            <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
              <ForexWordmark variant="light" size="sm" />
              <button type="button" className="p-2 text-slate-500" onClick={() => setMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-2 flex-1">
              <Link
                to="/user/order-history"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-800"
              >
                <History className="w-5 h-5 text-blue-600" />
                <span className="flex-1 font-medium">Order history</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </nav>
            {user && (
              <p className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
                {user.name} · {user.loginId}
              </p>
            )}
          </aside>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          className="p-2 text-slate-600"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
        >
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
          <button
            type="button"
            className="p-2 text-blue-600 disabled:opacity-40"
            aria-label="Download statement PDF"
            disabled={downloading}
            onClick={downloadPdf}
          >
            <Download className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-slate-600" aria-label="Sort">
            <ArrowUpDown className="w-5 h-5" />
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
        <span className="text-xs text-slate-500">{trades.length} open</span>
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
                    Buy {fmt(buy)} · Sell {fmt(sell)}
                  </p>
                  {t.scheduledMoveAt && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Moves to history {new Date(t.scheduledMoveAt).toLocaleString()}
                    </p>
                  )}
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
