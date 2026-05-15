import { useState, useCallback } from "react";
import { ToastProps, ToastType } from "@/components/ui/Toast";

interface AddToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastProps[];
  toast: (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => void;
  addToast: (options: AddToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => {
      const id = Date.now().toString();
      const newToast: ToastProps = {
        id,
        title,
        description: options?.description,
        type: options?.type || "info",
        duration: options?.duration || 5000,
        onClose: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const addToast = useCallback(
    ({ title, description, type, duration }: AddToastOptions) => {
      toast(title, { description, type, duration });
    },
    [toast]
  );

  const success = useCallback((title: string, description?: string) => toast(title, { description, type: "success" }), [toast]);
  const error = useCallback((title: string, description?: string) => toast(title, { description, type: "error" }), [toast]);
  const warning = useCallback((title: string, description?: string) => toast(title, { description, type: "warning" }), [toast]);
  const info = useCallback((title: string, description?: string) => toast(title, { description, type: "info" }), [toast]);

  return {
    toasts,
    toast,
    addToast,
    success,
    error,
    warning,
    info,
    dismiss,
    removeToast: dismiss,
  };
}
