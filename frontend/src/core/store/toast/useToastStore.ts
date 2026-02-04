"use client";

import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: makeId() }].slice(-4),
    })),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/**
 * Hook for showing toasts with convenience methods
 */
export function useToast() {
  const push = useToastStore((state) => state.push);

  return {
    toast: {
      info: (message: string) => push({ type: "info", message }),
      success: (message: string) => push({ type: "success", message }),
      error: (message: string) => push({ type: "error", message }),
    },
  };
}
