"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/src/lib/schemas";
import { useAppStore } from "@/src/core/store/appStore";
import { useLoginMutation } from "@/src/features/auth/auth.hooks";
import styles from "../styles/AuthForm.module.css";

export function LoginForm() {
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const closeAuthModal = useAppStore((state) => state.closeAuthModal);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearErrors("root");
    try {
      await loginMutation.mutateAsync(data);
      closeAuthModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unauthorized";
      setError("root", { message });
    }
  };

  const isPending = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {errors.root?.message && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="login-identifier" className={styles.label}>
          Email or username
        </label>
        <input
          id="login-identifier"
          type="text"
          {...register("login")}
          aria-invalid={errors.login ? "true" : "false"}
          className={styles.input}
        />
        {errors.login && (
          <span role="alert" className={styles.error}>
            {errors.login.message}
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
