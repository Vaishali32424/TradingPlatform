import { Router } from "express";

const router = Router();

const STOCKS = [
  { id: "AAPL", name: "Apple", symbol: "AAPL" },
  { id: "GOOGL", name: "Google", symbol: "GOOGL" },
  { id: "MSFT", name: "Microsoft", symbol: "MSFT" },
  { id: "TSLA", name: "Tesla", symbol: "TSLA" },
  { id: "META", name: "Facebook", symbol: "META" },
  { id: "005930.KS", name: "Samsung", symbol: "005930.KS" },
];

const CRYPTO_IDS = ["bitcoin", "ethereum", "ripple", "litecoin"];

async function fetchYahooChart(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error("Yahoo fetch failed");
  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; previousClose?: number };
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: (number | null)[] }> };
      }>;
    };
  };
  const result = json.chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice ?? 0;
  const prev = result?.meta?.previousClose ?? price;
  const closes =
    result?.indicators?.quote?.[0]?.close?.filter((c): c is number => c != null) ?? [];
  const sparkline = closes.slice(-24).length > 2 ? closes.slice(-24) : [prev, price];
  const change = prev ? ((price - prev) / prev) * 100 : 0;
  return { price, change, sparkline };
}

router.get("/stocks", async (_req, res) => {
  try {
    const items = await Promise.all(
      STOCKS.map(async (s) => {
        try {
          const data = await fetchYahooChart(s.symbol);
          return { ...s, ...data, currency: "USD" };
        } catch {
          return {
            ...s,
            price: 0,
            change: 0,
            sparkline: [100, 102, 101, 103, 102],
            currency: "USD",
          };
        }
      })
    );
    res.json(items);
  } catch {
    res.status(500).json({ message: "Could not load stock data" });
  }
});

router.get("/crypto", async (_req, res) => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(",")}&sparkline=true&price_change_percentage=24h`;
    const resApi = await fetch(url);
    if (!resApi.ok) throw new Error("CoinGecko failed");
    const data = (await resApi.json()) as Array<{
      id: string;
      name: string;
      symbol: string;
      current_price: number;
      price_change_percentage_24h: number;
      sparkline_in_7d?: { price: number[] };
    }>;
    res.json(
      data.map((c) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change: c.price_change_percentage_24h ?? 0,
        sparkline: c.sparkline_in_7d?.price?.slice(-24) ?? [c.current_price],
        currency: "USD",
      }))
    );
  } catch {
    res.status(500).json({ message: "Could not load crypto data" });
  }
});

export default router;
