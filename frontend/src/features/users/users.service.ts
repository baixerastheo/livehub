import { fetchJson } from "@/src/lib/apiClient";
import type {
  GetUserByIdResponseDto,
  ListUsersResponseDto,
} from "@/src/features/users/users.types";

export type ListUsersParams = {
  /**
   * Search term.
   * Note: backend doesn't currently expose `q` on `GET /users`, so filtering
   * is done in the hook for now.
   */
  q?: string;
};

export async function listUsers(_params: ListUsersParams = {}): Promise<ListUsersResponseDto> {
  void _params;
  return fetchJson<ListUsersResponseDto>("/users", {
    method: "GET",
  });
}

export async function getUserById(id: number): Promise<GetUserByIdResponseDto> {
  return fetchJson<GetUserByIdResponseDto>(`/users/${id}`, {
    method: "GET",
  });
}

export const usersService = {
  getUserById,
  listUsers,
};
