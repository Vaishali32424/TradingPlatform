import { tradeProfitLoss } from "./tradeCalc.js";

export type LedgerEntry = {
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  type: "deposit" | "withdrawal" | "trade_pl" | "opening" | "closing";
};

export function buildStatementLedger(items: {
  deposits: { amount: number; createdAt: Date | string; note?: string; addedBy?: string }[];
  withdrawals: { amount: number; createdAt: Date | string; status: string }[];
  trades: {
    companyName?: string;
    tradeName?: string;
    side?: string;
    lots?: number;
    createdAt?: Date | string;
    movedToHistoryAt?: Date | string;
    profitLoss?: number;
    buyAmount?: number;
    sellAmount?: number;
    amount?: number;
  }[];
  openingBalance?: number;
}): LedgerEntry[] {
  type Raw = {
    at: number;
    description: string;
    credit: number;
    debit: number;
    type: LedgerEntry["type"];
  };

  const raw: Raw[] = [];

  for (const d of items.deposits) {
    raw.push({
      at: new Date(d.createdAt).getTime(),
      description: d.note
        ? `Broker credit — ${d.note}`
        : `Broker credit${d.addedBy ? ` (${d.addedBy})` : ""}`,
      credit: d.amount,
      debit: 0,
      type: "deposit",
    });
  }

  for (const w of items.withdrawals) {
    if (w.status !== "approved") continue;
    raw.push({
      at: new Date(w.createdAt).getTime(),
      description: "Withdrawal approved",
      credit: 0,
      debit: w.amount,
      type: "withdrawal",
    });
  }

  for (const t of items.trades) {
    const pl =
      t.profitLoss ??
      tradeProfitLoss({
        side: t.side,
        buyAmount: t.buyAmount,
        sellAmount: t.sellAmount,
        amount: t.amount,
        lots: t.lots,
      });
    const label = t.companyName ?? t.tradeName ?? "Trade";
    const at = t.movedToHistoryAt
      ? new Date(t.movedToHistoryAt).getTime()
      : new Date(t.createdAt ?? Date.now()).getTime();
    raw.push({
      at,
      description: `${label} · ${t.side ?? "buy"} ${t.lots ?? 1} — P/L`,
      credit: pl > 0 ? pl : 0,
      debit: pl < 0 ? Math.abs(pl) : 0,
      type: "trade_pl",
    });
  }

  raw.sort((a, b) => a.at - b.at);

  let balance = items.openingBalance ?? 0;
  const ledger: LedgerEntry[] = [
    {
      date: raw[0] ? new Date(raw[0].at).toISOString() : new Date().toISOString(),
      description: "Opening balance",
      credit: 0,
      debit: 0,
      balance,
      type: "opening",
    },
  ];

  for (const r of raw) {
    balance += r.credit - r.debit;
    ledger.push({
      date: new Date(r.at).toISOString(),
      description: r.description,
      credit: r.credit,
      debit: r.debit,
      balance: Number(balance.toFixed(2)),
      type: r.type,
    });
  }

  ledger.push({
    date: new Date().toISOString(),
    description: "Closing balance",
    credit: 0,
    debit: 0,
    balance: Number(balance.toFixed(2)),
    type: "closing",
  });

  return ledger;
}
