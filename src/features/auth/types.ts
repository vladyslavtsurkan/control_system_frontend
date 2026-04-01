export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface SignUpResponse {
  message: string;
}

export interface SignUpVerifyRequest {
  email: string;
  code: string;
}

export interface SignUpVerifyResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
}
