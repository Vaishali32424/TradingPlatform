import type { ITrade } from "../models/Trade.js";

export function tradeProfitLoss(trade: {
  side?: string;
  buyAmount?: number;
  sellAmount?: number;
  amount?: number;
  lots?: number;
  plMultiplier?: number;
}): number {
  const buy = trade.buyAmount ?? trade.amount ?? 0;
  const sell = trade.sellAmount ?? trade.amount ?? 0;
  const lots = trade.lots ?? 1;
  const multiplier = trade.plMultiplier ?? 1;
  return Number(((sell - buy) * lots * multiplier).toFixed(3));
}

export function normalizeTrade(trade: Record<string, unknown>) {
  const buyAmount = (trade.buyAmount as number) ?? (trade.amount as number) ?? 0;
  const sellAmount = (trade.sellAmount as number) ?? (trade.amount as number) ?? 0;
  const out: Record<string, unknown> = {
    ...trade,
    buyAmount,
    sellAmount,
    plMultiplier: (trade.plMultiplier as number) ?? 1,
    profitLoss: tradeProfitLoss({
      side: trade.side as string,
      buyAmount,
      sellAmount,
      lots: trade.lots as number,
      plMultiplier: (trade.plMultiplier as number) ?? 1,
    }),
  };
  if (trade.scheduledMoveAt) {
    out.scheduledMoveAt = new Date(trade.scheduledMoveAt as string | Date).toISOString();
  }
  if (trade.movedToHistoryAt) {
    out.movedToHistoryAt = new Date(trade.movedToHistoryAt as string | Date).toISOString();
  }
  if (trade.inOrderHistory !== undefined) {
    out.inOrderHistory = Boolean(trade.inOrderHistory);
  }
  return out;
}
