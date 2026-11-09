import { router } from "expo-router";
import { closeSession } from "../redux/actions";
import { setAccessToken } from "../redux/sessionSlice";
import { clearElevated } from "../redux/mfaSlice";
import { store } from "../redux/store";
import { clearRefresh, readRefresh, saveRefresh } from "../session/secureTokens";

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4100";
let isRefreshing = false;
const waiting: ((token: string | null) => void)[] = [];
export let refreshCount = 0;

function processWaiting(error: unknown | null, token: string | null) {
  waiting.splice(0).forEach((resolve) => resolve(error ? null : token));
}

function decodeExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const raw = atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(raw);
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

async function refreshAccess(): Promise<string> {
  const refresh = await readRefresh();
  if (!refresh) throw new Error("No hay refresh guardado.");
  const response = await plainFetch("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh })
  });
  if (!response.ok) throw new Error("No se pudo renovar la sesión.");
  const data = await response.json();
  await saveRefresh(data.refresh_token);
  store.dispatch(setAccessToken(data.access_token));
  refreshCount += 1;
  return data.access_token as string;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) {
    const state = store.getState();
    const accessToken = state.session.accessToken;
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (path.includes("/api/boveda-critica")) {
    const elevated = store.getState().mfa.elevatedToken;
    const exp = decodeExp(elevated);
    if (elevated && exp && exp > Math.floor(Date.now() / 1000)) {
      headers.set("x-elevated-token", elevated);
    } else if (elevated) {
      store.dispatch(clearElevated());
    }
  }

  let response = await plainFetch(path, { ...init, headers });
  if (response.status !== 401 || path.includes("/auth/refresh")) return response;

  if (isRefreshing) {
    const token = await new Promise<string | null>((resolve) => waiting.push(resolve));
    if (!token) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
    headers.set("Authorization", `Bearer ${token}`);
    response = await plainFetch(path, { ...init, headers });
    return response;
  }

  isRefreshing = true;
  try {
    const token = await refreshAccess();
    processWaiting(null, token);
    headers.set("Authorization", `Bearer ${token}`);
    response = await plainFetch(path, { ...init, headers });
    return response;
  } catch {
    processWaiting(new Error("refresh_failed"), null);
    await clearRefresh();
    store.dispatch(closeSession());
    router.replace("/" as never);
    throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
  } finally {
    isRefreshing = false;
  }
}

export async function plainFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${baseURL}${path}`, init);
}
