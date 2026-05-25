import type { ITrade } from "../models/Trade.js";

export function tradeProfitLoss(trade: {
  side?: string;
  buyAmount?: number;
  sellAmount?: number;
  amount?: number;
  lots?: number;
}): number {
  const buy = trade.buyAmount ?? trade.amount ?? 0;
  const sell = trade.sellAmount ?? trade.amount ?? 0;
  const lots = trade.lots ?? 1;
  const diff = trade.side === "sell" ? buy - sell : sell - buy;
  return Number((diff * lots).toFixed(2));
}

export function normalizeTrade<T extends Record<string, unknown>>(trade: T): T & {
  buyAmount: number;
  sellAmount: number;
  profitLoss: number;
} {
  const buyAmount = (trade.buyAmount as number) ?? (trade.amount as number) ?? 0;
  const sellAmount = (trade.sellAmount as number) ?? (trade.amount as number) ?? 0;
  return {
    ...trade,
    buyAmount,
    sellAmount,
    profitLoss: tradeProfitLoss({
      side: trade.side as string,
      buyAmount,
      sellAmount,
      lots: trade.lots as number,
    }),
  };
}
