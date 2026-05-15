"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ToastProps, ToastContainer, ToastType } from "@/components/ui/Toast";

interface ToastContextType {
  toast: (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (title: string, options?: { description?: string; type?: ToastType; duration?: number }) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      title,
      description: options?.description,
      type: options?.type || "info",
      duration: options?.duration || 5000,
      onClose: (id) => setToasts(prev => prev.filter(t => t.id !== id))
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const success = (title: string, description?: string) => {
    toast(title, { description, type: "success" });
  };

  const error = (title: string, description?: string) => {
    toast(title, { description, type: "error" });
  };

  const warning = (title: string, description?: string) => {
    toast(title, { description, type: "warning" });
  };

  const info = (title: string, description?: string) => {
    toast(title, { description, type: "info" });
  };

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}
