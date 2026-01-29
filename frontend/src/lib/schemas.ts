import { z } from "zod";

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, { message: "Login is required" })
    .trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username must not exceed 50 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message:
          "Username can only contain letters, numbers and underscores",
      }),
    email: z.string().email({ message: "Invalid email" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(255, { message: "Password must not exceed 255 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

