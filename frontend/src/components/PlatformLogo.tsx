import { ForexWordmark } from "./ForexWordmark";

/** @deprecated Use ForexWordmark */
export function PlatformLogo({
  variant = "dark",
  height,
  className,
  size,
}: {
  variant?: "dark" | "light";
  height?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const resolved =
    size ?? (height != null && height >= 44 ? "lg" : height != null && height >= 34 ? "md" : "sm");
  return <ForexWordmark variant={variant} size={resolved} className={className} />;
}
