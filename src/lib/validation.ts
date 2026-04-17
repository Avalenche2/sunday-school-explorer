import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Prénom requis")
    .max(50, "Prénom trop long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Nom requis")
    .max(50, "Nom trop long"),
  age: z
    .number({ message: "Âge requis" })
    .int()
    .min(4, "Âge minimum : 4 ans")
    .max(18, "Âge maximum : 18 ans"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .max(255),
  password: z
    .string()
    .min(8, "Mot de passe : 8 caractères minimum")
    .max(72, "Mot de passe trop long"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(72),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
