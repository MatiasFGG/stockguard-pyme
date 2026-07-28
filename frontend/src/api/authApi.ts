import httpClient from "./httpClient";

import type {
  ChangePasswordRequest,
  LoginCredentials,
  LoginResponse,
} from "../types/auth";

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const formData = new URLSearchParams();

  formData.set("grant_type", "password");
  formData.set("username", credentials.username);
  formData.set("password", credentials.password);
  formData.set("scope", "");

  const response = await httpClient.post<LoginResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data;
}

export async function changePassword(
  passwordData: ChangePasswordRequest,
): Promise<void> {
  await httpClient.patch(
    "/auth/change-password",
    passwordData,
  );
}