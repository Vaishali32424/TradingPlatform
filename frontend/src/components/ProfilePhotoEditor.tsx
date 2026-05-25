import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import api from "../api/client";
import { ProfileAvatar } from "./ProfileAvatar";
import { getApiErrorMessage, toastError, toastSuccess } from "../utils/toast";

type ProfilePhotoEditorProps = {
  name: string;
  photoUrl?: string | null;
  uploadUrl: string;
  onUpdated: (photoUrl: string) => void;
  size?: "md" | "lg";
};

export function ProfilePhotoEditor({
  name,
  photoUrl,
  uploadUrl,
  onUpdated,
  size = "lg",
}: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayPhoto = preview ?? photoUrl;

  const handleFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const { data } = await api.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPhoto =
        data.profilePhoto ?? data.user?.profilePhoto ?? data.broker?.profilePhoto;
      if (newPhoto) {
        onUpdated(newPhoto);
        setPreview(null);
        toastSuccess("Profile photo updated");
      }
    } catch (err: unknown) {
      toastError(getApiErrorMessage(err, "Could not upload photo"));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <ProfileAvatar name={name} photoUrl={displayPhoto} size={size} />
        <button
          type="button"
          className="absolute -bottom-1 -right-1 p-2 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-500 disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Change photo"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          handleFile(file);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-slate-500">{uploading ? "Uploading..." : "Tap camera to change photo"}</p>
    </div>
  );
}
