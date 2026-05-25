import { ProfileAvatar } from "./ProfileAvatar";
import { formatPersonLabel } from "../utils/displayName";

type PersonRowProps = {
  name: string;
  id: string;
  photoUrl?: string | null;
  subtitle?: string;
  trailing?: React.ReactNode;
  size?: "sm" | "md";
};

export function PersonRow({
  name,
  id,
  photoUrl,
  subtitle,
  trailing,
  size = "md",
}: PersonRowProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <ProfileAvatar name={name} photoUrl={photoUrl} size={size === "sm" ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{name}</p>
        <p className="text-xs text-brand-500 truncate">{id}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

export function PersonRowLabel({ name, id }: { name: string; id: string }) {
  return <span>{formatPersonLabel(name, id)}</span>;
}
