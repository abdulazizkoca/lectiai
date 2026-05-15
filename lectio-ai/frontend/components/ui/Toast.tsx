import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, type = "info", duration = 5000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onClose(id);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [duration, id, onClose]);

  const icons = {
    success: <CheckCircle className="text-[#0D9373]" />,
    error: <AlertCircle className="text-[#E84855]" />,
    warning: <AlertTriangle className="text-[#F5A623]" />,
    info: <Info className="text-[#1B4FD8]" />
  };

  const colors = {
    success: "bg-[#0D9373]",
    error: "bg-[#E84855]",
    warning: "bg-[#F5A623]",
    info: "bg-[#1B4FD8]"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="relative w-full sm:w-96 bg-[#FAFAF7] dark:bg-[#18181F] rounded-xl shadow-lg border border-black/10 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 pr-8">
          <h4 className="font-bold text-sm text-black dark:text-white">{title}</h4>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <button 
          onClick={() => onClose(id)} 
          className="absolute right-4 top-4 text-slate-400 hover:text-black dark:hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800">
        <motion.div 
          className={`h-full ${colors[type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// Global Toast Container (To be mounted at root)
// This is a simple implementation. In real app, use Context or Zustand.
export const ToastContainer = ({ toasts, onClose }: { toasts: ToastProps[], onClose: (id: string) => void }) => (
  <div className="fixed top-[97px] right-4 z-50 flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onClose={onClose} />
        </div>
      ))}
    </AnimatePresence>
  </div>
);
