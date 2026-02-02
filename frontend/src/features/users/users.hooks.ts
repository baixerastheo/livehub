"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { usersKeys } from "@/src/features/users/users.types";
import type {
  ListUsersResponseDto,
  UsersListQueryInput,
} from "@/src/features/users/users.types";
import { usersService } from "@/src/features/users/users.service";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function filterUsersByQuery(
  users: ListUsersResponseDto,
  q?: string,
): ListUsersResponseDto {
  const query = q ? normalize(q) : "";
  if (!query) return users;

  return users.filter((u) => {
    const username = normalize(u.nomUtilisateur ?? "");
    return username.includes(query);
  });
}

export function useUsersQuery(input: UsersListQueryInput = {}) {
  const q = input.q ?? "";

  return useQuery({
    queryKey: usersKeys.list({ q }),
    queryFn: async () => {
      const users = await usersService.listUsers({ q });
      return filterUsersByQuery(users, q);
    },
  });
}

export function useUserQuery(id?: number) {
  return useQuery({
    queryKey: id ? usersKeys.detail(id) : usersKeys.details(),
    queryFn: id ? () => usersService.getUserById(id) : skipToken,
  });
}

