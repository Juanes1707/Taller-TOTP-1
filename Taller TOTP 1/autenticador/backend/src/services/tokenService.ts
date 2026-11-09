import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const SIGN_ALGORITHM: SignOptions["algorithm"] = "HS384";

export function mintToken(payload: object, ttlSeconds: number, secret: string): string {
  return jwt.sign(payload, secret, { algorithm: SIGN_ALGORITHM, expiresIn: ttlSeconds });
}

export function readToken<T extends object>(token: string, secret: string): T & JwtPayload {
  return jwt.verify(token, secret, { algorithms: ["HS384"] }) as T & JwtPayload;
}
