export function passwordStrength(password: string): { filledSegments: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[a-zA-Z]/.test(password)) score += 1;

  const labels = ["", "Weak", "Fair", "Good"];
  return { filledSegments: score, label: labels[score] ?? "Good" };
}

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
