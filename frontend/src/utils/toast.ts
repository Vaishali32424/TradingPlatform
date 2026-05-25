import toast from "react-hot-toast";

export function toastSuccess(message: string) {
  toast.success(message, { duration: 4000 });
}

export function toastError(message: string) {
  toast.error(message, { duration: 5000 });
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    if (msg) return msg;
  }
  return fallback;
}
