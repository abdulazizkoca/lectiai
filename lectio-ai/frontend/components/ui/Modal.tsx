import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "fullscreen";
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, size = "md", children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
    fullscreen: "max-w-[100vw] h-[100dvh] rounded-none"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full bg-[#FAFAF7] dark:bg-[#18181F] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden ${sizes[size]}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export const ModalHeader = ({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) => (
  <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
    <h3 className="text-xl font-display font-bold text-black dark:text-white">{children}</h3>
    {onClose && (
      <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-black dark:hover:text-white">
        <X size={20} />
      </button>
    )}
  </div>
);

export const ModalBody = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 overflow-y-auto flex-1 ${className}`}>
    {children}
  </div>
);

export const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 bg-[#F8F6F2] dark:bg-[#0A0A0F]/50 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3">
    {children}
  </div>
);
