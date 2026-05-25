import {
  Building2,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  TrendingUp,
  PieChart,
  Coins,
  Gem,
} from "lucide-react";
import { MarketCarousel } from "../../components/user/MarketCarousel";
import { toastError } from "../../utils/toast";

const PAYMENT_METHODS = [
  { name: "UPI", icon: Smartphone },
  { name: "Net Banking", icon: Landmark },
  { name: "Debit Card", icon: CreditCard },
  { name: "Wallet", icon: Wallet },
];

const INVEST_LINKS = [
  { label: "IPO", icon: TrendingUp, url: "https://ipowatch.in/" },
  { label: "Mutual Fund", icon: PieChart, url: "https://www.etmoney.com/mutual-funds/all-funds-listing" },
  { label: "ETF", icon: Building2, url: "https://etfdb.com/etfs/" },
  { label: "SGB", icon: Gem, url: "https://www.nseindia.com/market-data/sovereign-gold-bond" },
];

export default function UserHome() {
  const showError = () => toastError("Something went wrong. Please try again later.");

  return (
    <div className="px-4 pb-24 pt-4 space-y-5">
      <MarketCarousel
        title="Trading view"
        endpoint="/market/stocks"
        tradingViewSymbol={(item) =>
          item.symbol.includes(".") ? item.symbol : `NASDAQ:${item.symbol}`
        }
      />

      <MarketCarousel
        title="Crypto market overview"
        endpoint="/market/crypto"
        tradingViewSymbol={(item) => `BINANCE:${item.symbol}USDT`}
      />

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Coins className="w-5 h-5 text-blue-600" />
          Add funds
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_METHODS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={showError}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Icon className="w-7 h-7 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">{name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Invest more</h3>
        <div className="grid grid-cols-2 gap-3">
          {INVEST_LINKS.map(({ label, icon: Icon, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Icon className="w-7 h-7 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
