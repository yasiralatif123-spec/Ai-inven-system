import { apiFetch } from "../../../app/lib/api";
import type { AuthUser, InviteDetails } from "../types";

export type ApiError = {
  message: string;
  errors?: Array<{ path: string; message: string }>;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const data = await parseJson<T & ApiError>(response);
  if (!response.ok) {
    const error = new Error(data?.message || "Request failed") as Error & ApiError;
    error.message = data?.message || "Request failed";
    error.errors = data?.errors;
    throw error;
  }
  return data;
}

export async function login(email: string, password: string) {
  return requestJson<{ message: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return requestJson<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe() {
  return requestJson<{ user: AuthUser | null }>("/api/auth/me");
}

export async function validateInvite(token: string) {
  return requestJson<{ invite: InviteDetails }>("/api/auth/invites/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function acceptInvite(payload: {
  token: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return requestJson<{ message: string; user: AuthUser }>("/api/auth/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string) {
  return requestJson<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return requestJson<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
