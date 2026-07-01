"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { FaceRegistration } from "@/components/student/FaceRegistration";
import { getStoredUserId } from "@/lib/api";

export default function FaceRegistrationPage() {
  const router = useRouter();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userId, setUserId] = useState<number>(0);

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) {
      router.replace("/login");
      return;
    }
    setUserId(id);
  }, [router]);

  const handleRegistrationComplete = (success: boolean) => {
    setRegistrationComplete(success);
    if (success) {
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 3000);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 transition-colors hover:text-saffron"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          O&apos;quvchi
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {!registrationComplete ? (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
                Yuzni ro&apos;yxatdan o&apos;tkazish
              </h1>
              <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
                Darsda sizni avtomatik taniy olish uchun yuzingizni ro&apos;yxatdan o&apos;tkazing
              </p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 text-jade">
                Muvaffaqiyatli ro&apos;yxatdan o&apos;tdingiz! 🎉
              </h1>
              <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
                Endi darsda sizni avtomatik taniydi
              </p>
            </div>
          )}

          <FaceRegistration
            userId={userId}
            onRegistrationComplete={handleRegistrationComplete}
          />

          {/* Privacy notice */}
          <div className="mt-8 p-4 rounded-xl border border-saffron/20 bg-saffron/5">
            <h3 className="text-sm font-semibold text-saffron mb-2">
              Maxfiylik haqida
            </h3>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Sizning yuz ma&apos;lumotlaringiz faqat darsda sizni taniy olish uchun ishlatiladi.
              Ma&apos;lumotlar xavfsiz saqlanadi va uchinchi shaxslarga berilmaydi.
              Istalgan vaqtda ro&apos;yxatdan o&apos;chirishingiz mumkin.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
