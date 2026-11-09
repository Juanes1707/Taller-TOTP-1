import { randomBytes } from "node:crypto";
import { createCodeChallenge } from "../src/services/pkceService";
import { makeTotp } from "../src/services/totpService";
import { MFA_SEED } from "../src/routers/mfaRouter";

const baseUrl = process.env.SMOKE_URL ?? "http://127.0.0.1:4100";

async function request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { text };
  }
  return { status: response.status, data: data as Record<string, string> };
}

async function formRequest(body: Record<string, string>) {
  const response = await fetch(`${baseUrl}/oauth/authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    redirect: "manual",
    body: new URLSearchParams(body).toString()
  });
  return {
    status: response.status,
    location: response.headers.get("location")
  };
}

function report(name: string, passed: boolean, detail = "") {
  console.log(`${passed ? "✅" : "❌"} ${name}${detail ? ` - ${detail}` : ""}`);
  if (!passed) process.exitCode = 1;
}

async function main() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createCodeChallenge(verifier);
  report("generar PKCE", challenge.length === 43);

  const state = "llave-state-smoke";
  const authorize = await request(
    "GET",
    `/auth/oauth/authorize?response_type=code&client_id=demo&redirect_uri=manual&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`
  );
  report("GET authorize", authorize.status === 200);

  const submitted = await formRequest({
    response_type: "code",
    email: "test@unisabana.edu.co",
    password: "test",
    client_id: "demo",
    redirect_uri: "manual",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  const location = new URL(submitted.location ?? "", "http://127.0.0.1");
  const authorizationCode = location.searchParams.get("code");
  const returnedState = location.searchParams.get("state");
  report(
    "POST authorize con redirect manual y state",
    submitted.status === 302 && returnedState === state && Boolean(authorizationCode)
  );
  if (!authorizationCode) return;

  const tokenBody = {
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: "manual",
    client_id: "demo",
    code_verifier: "INCORRECTO"
  };
  const wrong = await request("POST", "/auth/oauth/token", tokenBody);
  report("token con verifier incorrecto", wrong.status === 400);

  const correct = await request("POST", "/auth/oauth/token", { ...tokenBody, code_verifier: verifier });
  report("token con verifier correcto", correct.status === 200 && Boolean(correct.data.access_token));
  if (!correct.data.access_token) return;

  const profileHeaders = { authorization: `Bearer ${correct.data.access_token}` };
  const profile = await request("GET", "/api/perfil", undefined, profileHeaders);
  report("/api/perfil", profile.status === 200);

  const lockedVault = await request("GET", "/api/boveda-critica", undefined, profileHeaders);
  report("/api/boveda-critica con MFA requerido", lockedVault.status === 403 && lockedVault.data.error === "mfa_required" && Boolean(lockedVault.data.step_up_token));

  const totp = makeTotp(MFA_SEED);
  const mfa = await request("POST", "/auth/mfa/verify", {
    totp,
    step_up_token: lockedVault.data.step_up_token
  });
  report("verificación TOTP", mfa.status === 200 && Boolean(mfa.data.elevated_token));
  if (!mfa.data.elevated_token) return;

  const elevatedHeaders = {
    authorization: `Bearer ${correct.data.access_token}`,
    "x-elevated-token": mfa.data.elevated_token
  };
  const elevatedVault = await request("GET", "/api/boveda-critica", undefined, elevatedHeaders);
  report("bóveda con elevated_token", elevatedVault.status === 200);

  const replay = await request("POST", "/auth/mfa/verify", {
    totp,
    step_up_token: lockedVault.data.step_up_token
  });
  report("mismo verify (anti-replay)", replay.status === 409);

  const refreshed = await request("POST", "/auth/refresh", {
    refresh_token: correct.data.refresh_token
  });
  report("/auth/refresh", refreshed.status === 200 && Boolean(refreshed.data.refresh_token));

  const oldRefresh = await request("POST", "/auth/refresh", {
    refresh_token: correct.data.refresh_token
  });
  report("refresh viejo reutilizado", oldRefresh.status === 401);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
