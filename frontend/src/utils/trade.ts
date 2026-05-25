import type { Trade, TradeCurrency } from "../types";

export function formatBuySellLine(trade: {
  buyAmount?: number;
  sellAmount?: number;
  amount?: number;
}): string {
  const buy = trade.buyAmount ?? trade.amount ?? 0;
  const sell = trade.sellAmount ?? trade.amount ?? 0;
  const f = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Buy $${f(buy)} · Sell $${f(sell)}`;
}

export function formatTradeAmount(amount: number, currency: TradeCurrency = "USD"): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString()}`;
}

export function computeTradePL(trade: Trade & { profitLoss?: number }): number {
  if (trade.profitLoss != null) return trade.profitLoss;
  const buy = trade.buyAmount ?? trade.amount ?? 0;
  const sell = trade.sellAmount ?? trade.amount ?? 0;
  return Number((sell - buy).toFixed(2));
}

/** Live P/L from buying & selling price fields (USD). */
export function computePLFromPrices(buy: number, sell: number): number {
  if (!Number.isFinite(buy) || !Number.isFinite(sell)) return 0;
  return Number((sell - buy).toFixed(2));
}

export function formatTradeSummary(trade: Trade): string {
  const name = trade.companyName ?? trade.tradeName ?? "Trade";
  const option = trade.optionType?.toUpperCase() ?? "";
  const strike = trade.strikePrice != null ? `@ ${trade.strikePrice}` : "";
  return `${name} ${strike} ${option}`.trim();
}

export function formatTradeDetails(trade: Trade): string[] {
  const lines: string[] = [];
  if (trade.companyName) lines.push(`Symbol: ${trade.companyName}`);
  if (trade.lots != null) lines.push(`Lots: ${trade.lots}`);
  if (trade.side) lines.push(`Side: ${trade.side}`);
  if (trade.buyAmount != null) lines.push(`Buy: ${formatTradeAmount(trade.buyAmount, "USD")}`);
  if (trade.sellAmount != null) lines.push(`Sell: ${formatTradeAmount(trade.sellAmount, "USD")}`);
  if (trade.expiryDate) {
    lines.push(`Expiry: ${new Date(trade.expiryDate).toLocaleDateString()}`);
  }
  if (trade.strikePrice != null && trade.optionType) {
    lines.push(`Strike: ${trade.strikePrice} (${trade.optionType.toUpperCase()})`);
  }
  return lines;
}
