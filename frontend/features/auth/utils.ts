import type { AccountFormValues, BusinessFormValues, LoginFormValues } from "./types";

export function passwordStrength(password: string): { filledSegments: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[a-zA-Z]/.test(password)) score += 1;

  const labels = ["", "Weak", "Fair", "Good"];
  return { filledSegments: score, label: labels[score] ?? "Good" };
}

export function doPasswordsMatch(values: AccountFormValues): boolean {
  return values.password === values.confirmPassword;
}

export function isAccountStepValid(values: AccountFormValues): boolean {
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());

  return Boolean(
    values.fullName.trim() &&
      emailLooksValid &&
      values.phone.trim() &&
      values.password.length >= 8 &&
      /\d/.test(values.password) &&
      doPasswordsMatch(values)
  );
}

export function isBusinessStepValid(values: BusinessFormValues): boolean {
  return Boolean(values.businessName.trim() && values.city.trim());
}

export function isLoginFormValid(values: LoginFormValues): boolean {
  return Boolean(values.email.trim() && values.password.trim());
}
