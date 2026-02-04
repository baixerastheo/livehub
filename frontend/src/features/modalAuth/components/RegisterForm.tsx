"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/src/lib/schemas";
import { useRegisterMutation } from "@/src/features/auth/auth.hooks";
import { signInWithRoblox, signInWithGoogle } from "@/src/lib/auth-client";
import styles from "../styles/AuthForm.module.css";
import { useAuthModal } from "./useAuthModal";

export function RegisterForm() {
  const openAuthModal = useAuthModal().openLogin;
  const closeAuthModal = useAuthModal().close;
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearErrors("root");
    try {
      await registerMutation.mutateAsync({
        name: data.username,
        email: data.email,
        password: data.password,
      });
      closeAuthModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unauthorized";
      setError("root", { message });
    }
  };

  const isPending = isSubmitting || registerMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {errors.root?.message && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="register-username" className={styles.label}>
          Username
        </label>
        <input
          id="register-username"
          type="text"
          {...register("username")}
          aria-invalid={errors.username ? "true" : "false"}
          className={styles.input}
        />
        {errors.username && (
          <span role="alert" className={styles.error}>
            {errors.username.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-email" className={styles.label}>
          Email
        </label>
        <input
          id="register-email"
          type="email"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
          className={styles.input}
        />
        {errors.email && (
          <span role="alert" className={styles.error}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-password" className={styles.label}>
          Password
        </label>
        <input
          id="register-password"
          type="password"
          {...register("password")}
          aria-invalid={errors.password ? "true" : "false"}
          className={styles.input}
        />
        {errors.password && (
          <span role="alert" className={styles.error}>
            {errors.password.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-confirmPassword" className={styles.label}>
          Confirm password
        </label>
        <input
          id="register-confirmPassword"
          type="password"
          {...register("confirmPassword")}
          aria-invalid={errors.confirmPassword ? "true" : "false"}
          className={styles.input}
        />
        {errors.confirmPassword && (
          <span role="alert" className={styles.error}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`${styles.submit} ${isPending ? styles.submitDisabled : ""}`}
      >
        {isPending ? "Sending..." : "Create account"}
      </button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button
        type="button"
        onClick={() => signInWithRoblox()}
        className={styles.socialButton}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5.164 0L.001 18.932 18.836 24l5.163-18.932L5.164 0zm7.453 14.531l-3.26-.871.865-3.24 3.26.871-.865 3.24z" />
        </svg>
        Continue with Roblox
      </button>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className={styles.socialButton}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className={styles.switchContainer}>
        <button
          type="button"
          className={styles.switchLink}
          onClick={() => openAuthModal()}
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}