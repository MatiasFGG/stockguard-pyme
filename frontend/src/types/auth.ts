export type UserRole = "ADMINISTRADOR" | "VENDEDOR";

export interface AuthUser {
  id: number;
  full_name: string;
  username: string;
  email: string | null;
  role: UserRole;
  must_change_password: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ValidationErrorItem {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

export interface ApiErrorResponse {
  detail?: string | ValidationErrorItem[];
}