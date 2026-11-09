import { Request, Response, Router } from "express";
import { randomBytes } from "node:crypto";
import { refreshSessions, authorizationTickets } from "../data/memory";
import { matchesCodeVerifier } from "../services/pkceService";
import { mintToken } from "../services/tokenService";
import { environment } from "../env";

export const tokenRouter = Router();

function makeRefresh(subject: string): string {
  const value = randomBytes(32).toString("base64url");
  refreshSessions.set(value, { subject, expiresAt: Date.now() + 30 * 24 * 60 * 60_000 });
  return value;
}

tokenRouter.post("/auth/oauth/token", (request: Request, response: Response) => {
  const body = request.body ?? {};
  if (
    body.grant_type !== "authorization_code" ||
    typeof body.code !== "string" || !body.code ||
    typeof body.code_verifier !== "string" || body.code_verifier.length < 43 ||
    typeof body.redirect_uri !== "string" || !body.redirect_uri ||
    typeof body.client_id !== "string" || !body.client_id
  ) {
    response.status(400).json({ error: "invalid_request", message: "Datos de intercambio inválidos." });
    return;
  }
  const ticket = authorizationTickets.get(body.code);
  if (!ticket || ticket.expiresAt < Date.now()) {
    authorizationTickets.delete(body.code);
    response.status(400).json({ error: "invalid_grant", message: "Código inválido o expirado." });
    return;
  }
  if (ticket.clientId !== body.client_id || ticket.redirectUri !== body.redirect_uri) {
    authorizationTickets.delete(body.code);
    response.status(400).json({ error: "invalid_grant", message: "Cliente o URI de retorno no coinciden." });
    return;
  }
  if (!matchesCodeVerifier(body.code_verifier, ticket.challenge)) {
    response.status(400).json({ error: "invalid_grant", message: "code_verifier incorrecto." });
    return;
  }
  authorizationTickets.delete(body.code);
  const accessToken = mintToken({ sub: ticket.subject, type: "access", mfa_verified: false }, environment.accessTokenSeconds, environment.jwtSecret);
  const stepUp = mintToken({ sub: ticket.subject, type: "step_up" }, 300, environment.jwtSecret);
  const refresh = makeRefresh(ticket.subject);
  console.log("[Llave] Token intercambiado");
  response.status(200).json({
    token_type: "Bearer",
    access_token: accessToken,
    step_up_token: stepUp,
    refresh_token: refresh,
    expires_in: environment.accessTokenSeconds
  });
});

tokenRouter.post("/auth/refresh", (request: Request, response: Response) => {
  const oldRefresh = request.body?.refresh_token;
  if (typeof oldRefresh !== "string" || !oldRefresh) {
    response.status(400).json({ error: "invalid_request", message: "Falta refresh_token." });
    return;
  }
  const session = refreshSessions.get(oldRefresh);
  if (!session || session.expiresAt < Date.now()) {
    refreshSessions.delete(oldRefresh);
    response.status(401).json({ error: "invalid_token" });
    return;
  }
  refreshSessions.delete(oldRefresh);
  const newRefresh = makeRefresh(session.subject);
  const accessToken = mintToken({ sub: session.subject, type: "access", mfa_verified: false }, environment.accessTokenSeconds, environment.jwtSecret);
  console.log("[Llave] Refresh rotado");
  response.status(200).json({
    token_type: "Bearer",
    access_token: accessToken,
    refresh_token: newRefresh,
    expires_in: environment.accessTokenSeconds
  });
});

tokenRouter.post("/auth/logout", (request: Request, response: Response) => {
  const refresh = request.body?.refresh_token;
  if (typeof refresh === "string" && refresh) refreshSessions.delete(refresh);
  response.status(200).json({ ok: true });
});
