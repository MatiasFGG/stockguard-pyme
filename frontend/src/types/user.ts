export type UserRole =
  | "ADMINISTRADOR"
  | "VENDEDOR";

export interface SystemUser {
  id: number;
  full_name: string;
  username: string;
  email: string | null;

  role: UserRole;
  active: boolean;
  must_change_password: boolean;

  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserCreateRequest {
  full_name: string;
  username: string;
  email: string | null;
  password: string;

  role: UserRole;
  must_change_password: boolean;
}

export interface UserUpdateRequest {
  full_name: string;
  email: string | null;
  role: UserRole;
}

export interface UserStatusRequest {
  active: boolean;
}

export interface UserPasswordResetRequest {
  password: string;
  must_change_password: boolean;
}