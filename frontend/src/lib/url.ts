export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";

  if (/^https?:\/\//i.test(apiBase)) {
    return new URL(normalizedPath, `${apiBase.replace(/\/?$/, "/")}`).toString();
  }

  if (typeof window !== "undefined") {
    return new URL(`${apiBase.replace(/\/$/, "")}${normalizedPath}`, window.location.origin).toString();
  }

  return `${apiBase.replace(/\/$/, "")}${normalizedPath}`;
}
