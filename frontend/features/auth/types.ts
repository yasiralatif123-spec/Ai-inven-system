export type UserRole = "owner" | "admin" | "user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string | null;
  businessName: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
};

export type LoginFormValues = {
  email: string;
  password: string;
};

export type InviteDetails = {
  id: string;
  email: string;
  role: "admin" | "user";
  businessId: string;
  businessName: string | null;
  status: "Pending" | "Accepted" | "Revoked";
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type InviteAcceptFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
