import type { Prisma } from '../../generated/prisma/client.js';

export const publicUserSelect = {
  id: true,
  email: true,
  nomUtilisateur: true,
  statut: true,
  avatarPath: true,
  avatarUpdatedAt: true,
  creeLe: true,
  modifieLe: true,
} satisfies Prisma.UtilisateurSelect;

export type PublicUser = Prisma.UtilisateurGetPayload<{
  select: typeof publicUserSelect;
}>;
