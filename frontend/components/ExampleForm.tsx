"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import styles from "./ExampleForm.module.css";

export function ExampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log(data);
    // Traitez votre formulaire ici
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="login" className={styles.label}>
          Email or username
        </label>
        <input
          id="login"
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
        <label htmlFor="password" className={styles.label}>
          Mot de passe
        </label>
        <input
          id="password"
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
        disabled={isSubmitting}
        className={`${styles.submit} ${
          isSubmitting ? styles.submitDisabled : ""
        }`}
      >
        {isSubmitting ? "Envoi..." : "Se connecter"}
      </button>
    </form>
  );
}

