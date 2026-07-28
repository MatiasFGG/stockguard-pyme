import httpClient from "./httpClient";

import type {
  SystemUser,
  UserCreateRequest,
  UserPasswordResetRequest,
  UserStatusRequest,
  UserUpdateRequest,
} from "../types/user";

export async function getUsers(
  signal?: AbortSignal,
): Promise<SystemUser[]> {
  const response = await httpClient.get<
    SystemUser[]
  >("/users", {
    signal,
  });

  return response.data;
}

export async function createUser(
  userData: UserCreateRequest,
): Promise<SystemUser> {
  const response =
    await httpClient.post<SystemUser>(
      "/users",
      userData,
    );

  return response.data;
}

export async function updateUser(
  userId: number,
  userData: UserUpdateRequest,
): Promise<SystemUser> {
  const response =
    await httpClient.patch<SystemUser>(
      `/users/${userId}`,
      userData,
    );

  return response.data;
}

export async function updateUserStatus(
  userId: number,
  statusData: UserStatusRequest,
): Promise<SystemUser> {
  const response =
    await httpClient.patch<SystemUser>(
      `/users/${userId}/status`,
      statusData,
    );

  return response.data;
}

export async function resetUserPassword(
  userId: number,
  passwordData: UserPasswordResetRequest,
): Promise<SystemUser> {
  const response =
    await httpClient.patch<SystemUser>(
      `/users/${userId}/reset-password`,
      passwordData,
    );

  return response.data;
}