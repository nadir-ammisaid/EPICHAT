import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "L'email est requis" })
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .transform((v) => v.trim().toLowerCase()),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(1, "Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe est trop long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string({ message: "L'email est requis" })
      .min(1, "L'email est requis")
      .email("Format d'email invalide")
      .transform((v) => v.trim().toLowerCase()),
    username: z
      .string({ message: "Le nom d'utilisateur est requis" })
      .min(1, "Le nom d'utilisateur est requis")
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(32, "Le nom d'utilisateur ne doit pas dépasser 32 caractères")
      .transform((v) => v.trim()),
    password: z
      .string({ message: "Le mot de passe est requis" })
      .min(1, "Le mot de passe est requis")
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(128, "Le mot de passe est trop long")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
    confirmPassword: z
      .string({ message: "Veuillez confirmer le mot de passe" })
      .min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  username: z
    .string({ message: "Le nom d'utilisateur est requis" })
    .min(1, "Le nom d'utilisateur est requis")
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(32, "Le nom d'utilisateur ne doit pas dépasser 32 caractères")
    .transform((v) => v.trim()),
});

export type ProfileInput = z.infer<typeof profileSchema>;
