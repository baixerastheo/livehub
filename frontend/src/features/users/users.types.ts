export type StatutUtilisateur = "EN_LIGNE" | "ABSENT" | "INVISIBLE" | "HORS_LIGNE";

/** User shape returned by backend (Prisma User, better-auth compatible). */
export type UtilisateurDto = {
  id: string;
  email: string;
  name: string;
  statut: StatutUtilisateur;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
  avatarUrl?: string | null;
};

export type ListUsersResponseDto = UtilisateurDto[];
export type GetUserByIdResponseDto = UtilisateurDto;

export type UsersListQueryInput = {
  q?: string;
};

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (input: UsersListQueryInput) => [...usersKeys.lists(), input] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};
