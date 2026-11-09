import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { environment } from "../env";
import { mintToken, readToken } from "../services/tokenService";
import { accessFromRequest } from "../utils/bearer";

export const vaultRouter = Router();

function readAccess(request: Request, response: Response): { sub: string } | null {
  const token = accessFromRequest(request);
  if (!token) {
    response.status(401).json({ error: "invalid_token" });
    return null;
  }
  try {
    const payload = readToken<{ sub: string; type: string }>(token, environment.jwtSecret);
    if (payload.type !== "access") throw new Error("Tipo de token inválido");
    return payload;
  } catch (error) {
    response.status(401).json(error instanceof jwt.TokenExpiredError ? { error: "token_expired" } : { error: "invalid_token" });
    return null;
  }
}

vaultRouter.get("/api/perfil", (request: Request, response: Response) => {
  const identity = readAccess(request, response);
  if (!identity) return;
  response.status(200).json({
    nombre: "Usuario de Llave",
    usuario: identity.sub,
    email: identity.sub,
    saldo_visible: true
  });
});

vaultRouter.get("/api/boveda-critica", (request: Request, response: Response) => {
  const bearer = accessFromRequest(request);
  if (!bearer) {
    response.status(401).json({ error: "invalid_token" });
    return;
  }
  const elevated = request.headers["x-elevated-token"];
  let accessSubject: string;
  try {
    const bearerPayload = readToken<{ sub: string; type: string }>(bearer, environment.jwtSecret);
    if (bearerPayload.type === "elevated") {
      response.status(200).json({ boveda: true, saldo: 125000, usuario: bearerPayload.sub });
      return;
    }
    if (bearerPayload.type !== "access") throw new Error("Tipo de token inválido");
    accessSubject = bearerPayload.sub;
  } catch {
    response.status(401).json({ error: "invalid_token" });
    return;
  }
  if (typeof elevated !== "string" || !elevated) {
    console.log("[Llave] 403 mfa_required");
    response.status(403).json({
      error: "mfa_required",
      step_up_token: mintToken({ sub: accessSubject, type: "step_up" }, 300, environment.jwtSecret)
    });
    return;
  }
  try {
    const elevatedPayload = readToken<{ sub: string; type: string; mfa_verified?: boolean }>(elevated, environment.jwtSecret);
    if (elevatedPayload.type !== "elevated" || elevatedPayload.mfa_verified !== true || elevatedPayload.sub !== accessSubject) {
      throw new Error("Token elevado inválido");
    }
    response.status(200).json({ boveda: true, saldo: 125000, usuario: elevatedPayload.sub });
  } catch {
    response.status(401).json({ error: "invalid_token" });
  }
});
