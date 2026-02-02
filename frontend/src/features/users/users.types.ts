export type StatutUtilisateur = "EN_LIGNE" | "ABSENT" | "INVISIBLE" | "HORS_LIGNE";

export type UtilisateurDto = {
  id: number;
  email: string;
  nomUtilisateur: string;
  statut: StatutUtilisateur;
  creeLe: string;
  modifieLe: string;
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
};

export type ListUsersResponseDto = UtilisateurDto[];
export type GetUserByIdResponseDto = UtilisateurDto;

export type UsersListQueryInput = {
  q?: string;
};

/**
 * Query key factory for users-related queries.
 * Provides consistent keys for TanStack Query cache management.
 */
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (input: UsersListQueryInput) => [...usersKeys.lists(), input] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: number) => [...usersKeys.details(), id] as const,
};