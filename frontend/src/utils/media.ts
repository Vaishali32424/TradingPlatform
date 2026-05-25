export function getUploadUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const apiBase = import.meta.env.VITE_API_URL ?? "https://tradingplatform-rd74.onrender.com/api/";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
