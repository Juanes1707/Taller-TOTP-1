import { Request, Response, Router } from "express";
import { environment } from "../env";
import { rememberReplay } from "../data/memory";
import { mintToken, readToken } from "../services/tokenService";
import { validateTotp } from "../services/totpService";

export const MFA_SEED = "JBSWY3DPEHPK3PXP";
export const mfaRouter = Router();

mfaRouter.post("/auth/mfa/verify", (request: Request, response: Response) => {
  const body = request.body ?? {};
  const presentedCode = typeof body.code === "string" ? body.code : body.totp;
  if (typeof presentedCode !== "string" || !/^\d{6}$/.test(presentedCode) || typeof body.step_up_token !== "string" || !body.step_up_token) {
    response.status(400).json({ error: "invalid_request", message: "TOTP debe tener 6 dígitos." });
    return;
  }
  let stepUp: { sub: string; type: string };
  try {
    stepUp = readToken<{ sub: string; type: string }>(body.step_up_token, environment.jwtSecret);
  } catch {
    response.status(401).json({ error: "invalid_token" });
    return;
  }
  if (stepUp.type !== "step_up") {
    response.status(401).json({ error: "invalid_token" });
    return;
  }
  if (!validateTotp(MFA_SEED, presentedCode)) {
    response.status(401).json({ error: "invalid_totp" });
    return;
  }
  const replayKey = `${stepUp.sub}:${presentedCode}`;
  if (!rememberReplay(replayKey, Date.now() + 90_000)) {
    console.log("[Llave] Replay detectado");
    response.status(409).json({ error: "replay_detected" });
    return;
  }
  const elevated = mintToken({ sub: stepUp.sub, type: "elevated", mfa_verified: true }, 600, environment.jwtSecret);
  console.log("[Llave] TOTP válido");
  response.status(200).json({ elevated_token: elevated, expires_in: 300 });
});
