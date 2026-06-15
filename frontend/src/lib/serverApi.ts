import { cookies } from "next/headers";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isDockerBackendOrigin(origin: string) {
  try {
    return new URL(origin).hostname === "backend";
  } catch {
    return false;
  }
}

function resolveBackendOrigin() {
  const configured =
    process.env.BACKEND_URL ||
    process.env.SERVER_BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    "";

  const origin = trimTrailingSlash(configured.trim());

  if (!origin) {
    return "http://localhost:5000";
  }

  if (process.env.NODE_ENV !== "production" && isDockerBackendOrigin(origin)) {
    return "http://localhost:5000";
  }

  return origin;
}

const API_URL = resolveBackendOrigin();

export function buildBackendApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}/api${normalizedPath}`;
}

export async function requestBackendJson(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  let response: Response;
  try {
    response = await fetch(buildBackendApiUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(`Khong the ket noi backend tai ${API_URL}`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Yeu cau that bai");
  }

  return data;
}
