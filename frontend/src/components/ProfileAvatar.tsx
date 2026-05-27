import { getUploadUrl } from "../utils/media";
import { User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [imgError, setImgError] = useState(false);
  const src = useMemo(() => getUploadUrl(photoUrl), [photoUrl]);
  const showImage = Boolean(src) && !imgError;

  useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-brand-600/25 text-brand-400 font-semibold flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {showImage ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <User className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-8 h-8"} />
      )}
    </div>
  );
}
