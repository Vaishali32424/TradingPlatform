import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import type { Trade } from "../../types";
import { computeTradePL, formatBuySellLine } from "../../utils/trade";
import { downloadStatementPdf } from "../../utils/statementPdf";
import { getApiErrorMessage, toastError } from "../../utils/toast";

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

export default function OrderHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get("/user/order-history")
      .then((res) => setTrades(res.data.trades))
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { data } = await api.get("/user/order-history/statement");
      downloadStatementPdf({
        title: "Order History Statement",
        subtitle: "Closed / archived positions",
        accountName: data.user.name,
        ledger: data.ledger as LedgerRow[],
        positions: (data.trades as Trade[]).map((t) => ({
          label: `${t.companyName ?? t.tradeName} · ${t.side} ${t.lots}`,
          buy: t.buyAmount ?? t.amount ?? 0,
          sell: t.sellAmount ?? t.amount ?? 0,
          side: t.side,
          pl: t.profitLoss ?? computeTradePL(t),
        })),
        filename: `order-history-${data.user.userId}.pdf`,
      });
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not download statement"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-slate-500 animate-pulse">Loading order history...</div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Link to="/user/portfolio" className="p-2 text-slate-600" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-semibold text-slate-800">Order history</h1>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading || trades.length === 0}
          className="p-2 text-blue-600 disabled:opacity-40"
          aria-label="Download PDF"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white divide-y divide-slate-100">
        {trades.length === 0 ? (
          <p className="px-4 py-10 text-center text-slate-500 text-sm">
            No archived orders yet. Your broker moves completed trades here.
          </p>
        ) : (
          trades.map((t) => {
            const pl = t.profitLoss ?? computeTradePL(t);
            const plUp = pl >= 0;
            // const moved = t.movedToHistoryAt
            //   ? new Date(t.movedToHistoryAt).toLocaleString()
            //   : new Date(t.createdAt).toLocaleString();
            return (
              <div key={t._id} className="px-4 py-3.5">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {t.companyName ?? t.tradeName}
                      <span className="text-blue-600 font-semibold">
                        , {t.side} {t.lots}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1 tabular-nums">{formatBuySellLine(t)}</p>
                  </div>
                  <p className={`font-bold tabular-nums shrink-0 ${plUp ? "text-blue-600" : "text-red-500"}`}>

                    {plUp ? "" : "-"}
                    {fmt(Math.abs(pl))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
