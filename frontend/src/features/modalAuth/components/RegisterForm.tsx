"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/src/lib/schemas";
import { useAppStore } from "@/src/core/store/appStore";
import { useRegisterMutation } from "@/src/features/auth/auth.hooks";
import styles from "../styles/AuthForm.module.css";

export function RegisterForm() {
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const closeAuthModal = useAppStore((state) => state.closeAuthModal);
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
      await registerMutation.mutateAsync(data);
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

      <div className={styles.switchContainer}>
        <button
          type="button"
          className={styles.switchLink}
          onClick={() => openAuthModal("login")}
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}
