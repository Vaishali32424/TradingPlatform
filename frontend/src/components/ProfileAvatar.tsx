import { getUploadUrl } from "../utils/media";

type ProfileAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-20 h-20 text-xl",
};

export function ProfileAvatar({ name, photoUrl, size = "md", className = "" }: ProfileAvatarProps) {
  const src = getUploadUrl(photoUrl);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-brand-600/25 text-brand-400 font-semibold flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
