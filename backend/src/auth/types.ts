import type { Utilisateur } from '../../generated/prisma/client.js';

/** User shape attached to request after auth — never includes password. */
export type AuthenticatedUser = Omit<Utilisateur, 'motDePasse'>;
