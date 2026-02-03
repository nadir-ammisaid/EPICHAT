import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  username: z
    .string()
    .min(3)
    .max(32)
    .transform((v) => v.trim()),
  password: z.string().min(8).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
