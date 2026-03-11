import type { IncomingHttpHeaders } from 'http';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

/** Type de la session retournée par better-auth. */
export type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Extrait et valide la session better-auth à partir des headers HTTP.
 * Utilisé aussi bien dans les guards HTTP que dans le gateway WebSocket.
 * @param headers - Headers de la requête entrante (HTTP ou WebSocket handshake)
 * @returns La session si valide, null sinon
 */
export function getSessionFromHeaders(headers: IncomingHttpHeaders) {
  return auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });
}
