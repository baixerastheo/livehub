"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { useAppStore } from "@/src/core/store/appStore";
import { useLoginMutation } from "../api/useLoginMutation";
import styles from "../styles/AuthForm.module.css";

export function LoginForm() {
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
    // TODO: appeler l’API login quand le backend sera branché
  };

  const isPending = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="login-email" className={styles.label}>
          Email
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className={styles.label}>
          Password
        </label>
        <input
          id="login-password"
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

      <button
        type="submit"
        disabled={isPending}
        className={`${styles.submit} ${isPending ? styles.submitDisabled : ""}`}
      >
        {isPending ? "Sending..." : "Sign in"}
      </button>

      <div className={styles.switchContainer}>
        <button
          type="button"
          className={styles.switchLink}
          onClick={() => openAuthModal("register")}
        >
          No account? Sign up
        </button>
      </div>
    </form>
  );
}
