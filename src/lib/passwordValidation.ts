import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mot de passe : 8 caractères minimum")
      .max(72, "Mot de passe trop long"),
    confirm: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mot de passe : 8 caractères minimum")
      .max(72, "Mot de passe trop long"),
    confirm: z.string().min(1, "Confirmation requise"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });
