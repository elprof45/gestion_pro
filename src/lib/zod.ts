import { object, string, z } from "zod";

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});
export const signInSchema = object({
  email: string().email(
    {message:"Email invalide"}
  )
    .min(1, { message: "Email is required" }),
  password: string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be more than 8 characters" })
    .max(32, { message: "Password must be less than 32 characters" }),
});

export const signUpSchema = object({
  fullName: string().min(1, { message: "Name is required" }),
 number: string()
  .min(1, { message: "Phone is required" }),
  password: string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be more than 8 characters" })
    .max(32, { message: "Password must be less than 32 characters" }),
  specialty: string().min(1, { message: "specialty is required" }),
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(6, "Mot de passe trop court")
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1)
});

