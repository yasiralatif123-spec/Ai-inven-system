const { z } = require("zod");

const email = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.email("Invalid email").max(254)
);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const token = z.string().min(20).max(256);

const loginSchema = z
  .object({ email, password: z.string().min(1, "Password is required").max(128) })
  .strict();

const inviteCreateSchema = z.object({ email, role: z.enum(["admin", "user"]) }).strict();
const inviteValidateSchema = z.object({ token }).strict();

const inviteAcceptSchema = z
  .object({
    token,
    name: z.string().trim().min(2, "Name is required").max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const forgotPasswordSchema = z.object({ email }).strict();

const resetPasswordSchema = z
  .object({ token, password, confirmPassword: z.string() })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const userRoleSchema = z.object({ role: z.enum(["admin", "user"]) }).strict();

module.exports = {
  loginSchema,
  inviteCreateSchema,
  inviteValidateSchema,
  inviteAcceptSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userRoleSchema,
};
