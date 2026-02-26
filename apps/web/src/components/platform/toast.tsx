"use client";

import { useEffect, useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error";
}

let addToastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

export function showToast(message: string, type: Toast["type"] = "info") {
  addToastFn?.({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-right ${
            toast.type === "error"
              ? "bg-red-900/90 text-red-100 border border-red-700"
              : toast.type === "success"
                ? "bg-green-900/90 text-green-100 border border-green-700"
                : "bg-gray-800/90 text-gray-100 border border-gray-700"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
