import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";
import { Sparkline } from "./Sparkline";

export type MarketItem = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  sparkline: number[];
  currency: string;
};

function InlineChart({ tvSymbol, name }: { tvSymbol: string; name: string }) {
  return (
    <div className="mx-4 mb-3 rounded-lg border border-slate-100 bg-slate-50/80 overflow-hidden">
      <iframe
        title={`${name} chart`}
        className="w-full h-[140px] border-0"
        src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=D&theme=light&style=1&locale=en&hide_top_toolbar=1&hide_legend=1`}
      />
    </div>
  );
}

export function MarketCarousel({
  title,
  endpoint,
  tradingViewSymbol,
}: {
  title: string;
  endpoint: "/market/stocks" | "/market/crypto";
  tradingViewSymbol?: (item: MarketItem) => string;
}) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      api.get(endpoint).then((res) => {
        setItems(res.data);
        setLoading(false);
      });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [endpoint]);

  // useEffect(() => {
  //   if (items.length === 0) return;
  //   const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
  //   return () => clearInterval(t);
  // }, [items.length]);

  useEffect(() => {
    setSelectedId(null);
  }, [index]);

  const current = items[index];
  const selected = selectedId ? items.find((i) => i.id === selectedId) : null;

  const tvSymbolFor = (item: MarketItem) =>
    tradingViewSymbol
      ? tradingViewSymbol(item)
      : endpoint.includes("crypto")
        ? `BINANCE:${item.symbol}USDT`
        : `NASDAQ:${item.symbol}`;

  if (loading) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-24 bg-slate-100 rounded-xl" />
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {current && (
        <button
          type="button"
          className="w-full px-4 pb-2 text-left"
          onClick={() =>
            setSelectedId((id) => (id === current.id ? null : current.id))
          }
        >
          <div
            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
              selectedId === current.id
                ? "bg-blue-50/60 border-blue-200"
                : "bg-slate-50 border-slate-100 hover:border-blue-200"
            }`}
          >
            <div>
              <p className="font-bold text-slate-900">{current.name}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${current.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p
                className={`text-sm font-medium mt-0.5 ${
                  current.change >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {current.change >= 0 ? "+" : ""}
                {current.change.toFixed(2)}%
              </p>
            </div>
            <Sparkline
              data={current.sparkline}
              positive={current.change >= 0}
              width={72}
              height={36}
            />
          </div>
          <div className="flex justify-center gap-1.5 mt-2 pb-2">
            {items.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-blue-600" : "bg-slate-300"}`}
              />
            ))}
          </div>
        </button>
      )}

      {selected && (
        <InlineChart tvSymbol={tvSymbolFor(selected)} name={selected.name} />
      )}
    </section>
  );
}
