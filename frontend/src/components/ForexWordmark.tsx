/** Text wordmark: geometric mark + FOREX + superscript Plus (amber) */

type Variant = "dark" | "light";

const sizes = {
  sm: { mark: 22, forex: "text-lg", plus: "text-[0.45em]" },
  md: { mark: 28, forex: "text-xl", plus: "text-[0.48em]" },
  lg: { mark: 36, forex: "text-2xl sm:text-3xl", plus: "text-[0.5em]" },
};

function MarkIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path d="M4 24 L4 8 L14 8 L14 13 L9 17 L14 22 Z" fill="#2dd4bf" />
      <path d="M11 8 L11 24 L19 24 L19 8 Z" fill="#64748b" />
      <path d="M21 19 L27 24 L27 13 L21 8 Z" fill="#f97316" />
    </svg>
  );
}

export function ForexWordmark({
  variant = "dark",
  size = "md",
  className = "",
}: {
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  const forexColor = variant === "dark" ? "text-white" : "text-slate-900";

  return (
    <span
      className={`inline-flex items-center gap-2 select-none font-[family-name:var(--font-display)] ${className}`}
    >
      <MarkIcon size={s.mark} />
      <span className={`inline-flex items-baseline leading-none tracking-tight ${forexColor}`}>
        <span className={`font-bold ${s.forex} tracking-[0.06em]`}>FOREX</span>
        <sup
  className={`${s.plus} font-semibold text-amber-500 ml-0.5 leading-none relative -top-3`}
>
  Plus
</sup>
      </span>
    </span>
  );
}
