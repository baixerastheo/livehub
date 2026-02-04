import type { Prisma } from '../../generated/prisma/client.js';

/** Public fields for User (no password, no sensitive data). */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  statut: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
