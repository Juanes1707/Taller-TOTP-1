import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { environment } from "./env";
import { oauthRouter } from "./routers/oauthRouter";
import { tokenRouter } from "./routers/tokenRouter";
import { mfaRouter } from "./routers/mfaRouter";
import { vaultRouter } from "./routers/vaultRouter";
import { devRouter } from "./routers/devRouter";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_request: Request, response: Response) => response.status(200).json({ ok: true }));
app.use(oauthRouter);
app.use(tokenRouter);
app.use(mfaRouter);
app.use(vaultRouter);
app.use(devRouter);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  response.status(500).json({ error: "internal_error", message });
});

app.listen(environment.port, environment.host, () => {
  console.log(`Llave backend listening at http://${environment.host}:${environment.port}`);
  console.log(`En el teléfono usa la IPv4 de tu Wi-Fi: http://<TU-IP-WIFI>:${environment.port}`);
});
