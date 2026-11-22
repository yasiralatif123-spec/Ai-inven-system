const REQUIRED_SECRETS = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "TOKEN_PEPPER",
];

const MIN_SECRET_LENGTH = 32;

function isPlaceholder(value) {
  return /replace_with|change_this|your_|placeholder/i.test(value);
}

function validateAuthEnv() {
  const missing = [];
  const tooShort = [];
  const placeholders = [];

  for (const name of REQUIRED_SECRETS) {
    const value = process.env[name];
    if (!value) {
      missing.push(name);
    } else if (value.length < MIN_SECRET_LENGTH) {
      tooShort.push(`${name} (${value.length} chars)`);
    } else if (isPlaceholder(value)) {
      placeholders.push(name);
    }
  }

  const problems = [
    missing.length && `missing: ${missing.join(", ")}`,
    tooShort.length && `shorter than ${MIN_SECRET_LENGTH} chars: ${tooShort.join(", ")}`,
    placeholders.length && `still a placeholder: ${placeholders.join(", ")}`,
  ].filter(Boolean);

  if (problems.length) {
    throw new Error(
      `Invalid auth configuration - ${problems.join("; ")}. Generate values with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }

  return {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    tokenPepper: process.env.TOKEN_PEPPER,
  };
}

module.exports = { validateAuthEnv, REQUIRED_SECRETS, MIN_SECRET_LENGTH };
