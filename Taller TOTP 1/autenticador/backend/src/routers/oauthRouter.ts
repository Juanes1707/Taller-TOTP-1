import { Request, Response, Router } from "express";
import { randomBytes } from "node:crypto";
import { authorizationTickets } from "../data/memory";
import { renderLoginPage } from "../utils/loginHtml";

export const oauthRouter = Router();

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function displayAuthorization(request: Request, response: Response): void {
  const query = request.query;
  if (
    !hasText(query.client_id) ||
    !hasText(query.redirect_uri) ||
    !hasText(query.state) ||
    !hasText(query.code_challenge) ||
    query.code_challenge_method !== "S256" ||
    query.response_type !== "code"
  ) {
    response.status(400).type("html").send(renderLoginPage({
      state: hasText(query.state) ? query.state : "",
      redirectUri: hasText(query.redirect_uri) ? query.redirect_uri : "manual",
      challenge: hasText(query.code_challenge) ? query.code_challenge : "",
      clientId: hasText(query.client_id) ? query.client_id : "demo",
      method: "S256",
      message: "Faltan datos para iniciar el acceso."
    }));
    return;
  }
  response.status(200).type("html").send(renderLoginPage({
    state: query.state,
    redirectUri: query.redirect_uri,
    challenge: query.code_challenge,
    clientId: query.client_id,
    method: "S256"
  }));
}

function receiveAuthorization(request: Request, response: Response): void {
  const body = request.body ?? {};
  const validShape =
    hasText(body.email) &&
    hasText(body.password) &&
    hasText(body.client_id) &&
    hasText(body.redirect_uri) &&
    hasText(body.state) &&
    hasText(body.code_challenge) &&
    body.code_challenge_method === "S256" &&
    body.response_type === "code";

  if (!validShape) {
    response.status(400).type("html").send(renderLoginPage({
      state: hasText(body.state) ? body.state : "",
      redirectUri: hasText(body.redirect_uri) ? body.redirect_uri : "manual",
      challenge: hasText(body.code_challenge) ? body.code_challenge : "",
      clientId: hasText(body.client_id) ? body.client_id : "demo",
      method: "S256",
      message: "Revisa que todos los datos estén completos."
    }));
    return;
  }
  const allowedEmail = body.email === "test@unisabana.edu.co";
  if (!allowedEmail || body.password !== "test") {
    response.status(401).type("html").send(renderLoginPage({
      state: body.state,
      redirectUri: body.redirect_uri,
      challenge: body.code_challenge,
      clientId: body.client_id,
      method: "S256",
      message: "Correo o contraseña incorrectos."
    }));
    return;
  }
  const code = randomBytes(24).toString("base64url");
  authorizationTickets.set(code, {
    clientId: body.client_id,
    challenge: body.code_challenge,
    redirectUri: body.redirect_uri,
    state: body.state,
    subject: body.email,
    expiresAt: Date.now() + 5 * 60_000
  });
  console.log(`[Llave] Código emitido para ${body.email}`);
  const separator = body.redirect_uri.includes("?") ? "&" : "?";
  const destination = `${body.redirect_uri}${separator}code=${encodeURIComponent(code)}&state=${encodeURIComponent(body.state)}`;
  console.log(`[Llave] redirect_uri recibido: ${body.redirect_uri}`);
  console.log(`[Llave] redirigiendo a: ${destination}`);
  response.redirect(302, destination);
}

oauthRouter.get("/oauth/authorize", displayAuthorization);
oauthRouter.get("/auth/oauth/authorize", displayAuthorization);
oauthRouter.post("/oauth/authorize", receiveAuthorization);
oauthRouter.post("/auth/oauth/authorize", receiveAuthorization);
