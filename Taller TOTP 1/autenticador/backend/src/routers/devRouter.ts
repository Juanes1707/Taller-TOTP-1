import { Request, Response, Router } from "express";
import QRCode from "qrcode";
import { MFA_SEED } from "./mfaRouter";

export const devRouter = Router();

devRouter.get("/dev/qr", async (_request: Request, response: Response, next) => {
  try {
    const uri = `otpauth://totp/Llave:${encodeURIComponent("test@unisabana.edu.co")}?secret=${MFA_SEED}&issuer=Llave`;
    const svg = await QRCode.toString(uri, { type: "svg", width: 280, margin: 1 });
    response.status(200).type("html").send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Llave · QR de acceso</title>
<style>body{margin:0;background:#FAFAF7;color:#17221B;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center}.card{width:min(680px,calc(100% - 32px));text-align:center;background:#fff;border:1px solid #E4E7E0;border-radius:14px;padding:32px}h1{color:#16A34A}.qr{width:280px;min-height:280px;margin:24px auto}.qr svg{width:280px;height:280px}.secret{font-family:monospace;font-size:18px;user-select:all;word-break:break-all}.uri{color:#64748B;font-size:12px;overflow-wrap:anywhere}.notice{color:#166534;font-weight:700}</style>
</head><body><main class="card"><h1>Configuración Llave</h1><div class="qr">${svg}</div><p><strong>Secreto</strong></p><p class="secret">${MFA_SEED}</p><p class="uri">${uri}</p><p class="notice">Solo para la demostración</p></main></body></html>`);
  } catch (error) {
    next(error);
  }
});
