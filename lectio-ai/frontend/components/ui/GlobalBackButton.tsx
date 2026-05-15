"use client";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide the back button on the very root homepage
  if (pathname === "/") return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, backgroundColor: "var(--saffron)", color: "#000", borderColor: "var(--saffron)" }}
      whileTap={{ scale: 0.9 }}
      onClick={() => router.back()}
      className="fixed top-6 left-6 z-[100] w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 dark:bg-black/40 border border-white/20 dark:border-white/10 text-slate-800 dark:text-white backdrop-blur-xl shadow-xl transition-colors"
      aria-label="Orqaga qaytish"
    >
      <ArrowLeft size={24} />
    </motion.button>
  );
}
