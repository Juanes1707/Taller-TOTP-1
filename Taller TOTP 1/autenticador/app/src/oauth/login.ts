import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { NativeModules } from "react-native";
import { plainFetch } from "../http/apiFetch";
import { store } from "../redux/store";
import { setSession, setLoading } from "../redux/sessionSlice";
import { closeSession } from "../redux/actions";
import { setStepUp } from "../redux/mfaSlice";
import { readRefresh, saveRefresh, clearRefresh } from "../session/secureTokens";
import { makeChallenge, makeState, makeVerifier } from "./pkce";

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4100";
let verifier: string | null = null;
let stateValue: string | null = null;
export let simulateCsrf = false;
export function setSimulateCsrf(value: boolean) { simulateCsrf = value; }

function expoGoRedirectUri(): string | null {
  const scriptUrl = (NativeModules.SourceCode as { scriptURL?: unknown } | undefined)?.scriptURL;
  if (typeof scriptUrl !== "string") return null;
  try {
    const bundleUrl = new URL(scriptUrl);
    if (bundleUrl.protocol !== "http:" && bundleUrl.protocol !== "https:") return null;
    const scheme = bundleUrl.protocol === "https:" ? "exps" : "exp";
    return `${scheme}://${bundleUrl.host}/--/oauth/callback`;
  } catch {
    return null;
  }
}

export function redirectUri() {
  // Some Android Expo Go versions report "bare" to expo-constants. In that
  // case, derive the active Metro host directly from the loaded bundle.
  if (process.env.EXPO_PUBLIC_USE_EXPO_GO === "true") {
    const uri = expoGoRedirectUri();
    if (uri) return uri;
  }
  return AuthSession.makeRedirectUri({ path: "oauth/callback" });
}

export async function beginLlaveLogin(): Promise<void> {
  verifier = makeVerifier();
  stateValue = makeState();
  const challenge = await makeChallenge(verifier);
  const redirect = redirectUri();
  const query = new URLSearchParams({
    response_type: "code",
    client_id: "demo",
    redirect_uri: redirect,
    state: stateValue,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  const result = await WebBrowser.openAuthSessionAsync(`${baseURL}/auth/oauth/authorize?${query}`, redirect);
  if (result.type === "cancel" || result.type === "dismiss" || result.type !== "success") return;
  await handleLlaveCallback(result.url);
}

export async function handleLlaveCallback(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
  const returnedState = typeof parsed.queryParams?.state === "string" ? parsed.queryParams.state : null;
  if (simulateCsrf || !returnedState || returnedState !== stateValue) {
    throw new Error("State inválido: posible ataque CSRF. Se abortó el inicio de sesión.");
  }
  if (!code || !verifier) throw new Error("La respuesta OAuth está incompleta.");
  store.dispatch(setLoading(true));
  const exchange = await plainFetch("/auth/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri(),
      client_id: "demo"
    })
  });
  if (!exchange.ok) throw new Error("No se pudo intercambiar el código OAuth.");
  const tokens = await exchange.json();
  await saveRefresh(tokens.refresh_token);
  store.dispatch(setStepUp(tokens.step_up_token));
  const profile = await plainFetch("/api/perfil", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  if (!profile.ok) throw new Error("No se pudo cargar el perfil.");
  const user = await profile.json();
  store.dispatch(setSession({
    accessToken: tokens.access_token,
    user: user.email ?? user.usuario
  }));
}

export async function restoreLlaveSession(): Promise<void> {
  store.dispatch(setLoading(true));
  const refresh = await readRefresh();
  if (!refresh) {
    store.dispatch(setLoading(false));
    return;
  }
  try {
    const renewal = await plainFetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (!renewal.ok) throw new Error("Sesión no válida.");
    const tokens = await renewal.json();
    await saveRefresh(tokens.refresh_token);
    const profile = await plainFetch("/api/perfil", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (!profile.ok) throw new Error("Perfil no disponible.");
    const user = await profile.json();
    store.dispatch(setSession({ accessToken: tokens.access_token, user: user.email ?? user.usuario }));
  } catch {
    await clearRefresh();
    store.dispatch(closeSession());
  }
}

export async function verifyLlaveMfa(stepUpToken: string, code: string): Promise<{ elevatedToken: string }> {
  const response = await plainFetch("/auth/mfa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step_up_token: stepUpToken, code })
  });
  if (response.status === 401) throw new Error("Código incorrecto o vencido.");
  if (response.status === 409) throw new Error("Ataque de repetición detectado (409): este código ya fue usado.");
  if (!response.ok) throw new Error("No se pudo verificar el código.");
  const data = await response.json();
  return { elevatedToken: data.elevated_token };
}

export async function closeLlaveSession(): Promise<void> {
  const refresh = await readRefresh();
  if (refresh) {
    try {
      await plainFetch("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh })
      });
    } catch {
      // El cierre local no depende de la disponibilidad del servidor.
    }
  }
  await clearRefresh();
  store.dispatch(closeSession());
}
