import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Insira um endereço de e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const signUpSchema = z.object({
  fullName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Insira um endereço de e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  fullName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  headline: z.string().optional(),
});
