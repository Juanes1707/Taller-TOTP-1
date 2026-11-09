export interface AuthorizationTicket {
  clientId: string;
  challenge: string;
  redirectUri: string;
  state: string;
  subject: string;
  expiresAt: number;
}

export interface RefreshSession {
  subject: string;
  expiresAt: number;
}

export const authorizationTickets = new Map<string, AuthorizationTicket>();
export const refreshSessions = new Map<string, RefreshSession>();
export const replayExpirations = new Map<string, number>();

export function rememberReplay(key: string, expiresAt: number): boolean {
  const now = Date.now();
  for (const [storedKey, expiration] of replayExpirations) {
    if (expiration <= now) replayExpirations.delete(storedKey);
  }
  const oldExpiration = replayExpirations.get(key);
  if (oldExpiration !== undefined && oldExpiration > Date.now()) {
    return false;
  }
  if (oldExpiration !== undefined) {
    replayExpirations.delete(key);
  }
  replayExpirations.set(key, expiresAt);
  return true;
}
