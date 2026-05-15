"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { FaceRegistration } from "@/components/student/FaceRegistration";

export default function FaceRegistrationPage() {
  const router = useRouter();
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleRegistrationComplete = (success: boolean) => {
    setRegistrationComplete(success);
    if (success) {
      // Redirect back to dashboard after successful registration
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 3000);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", backgroundAttachment: "fixed" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">O'quvchi</span>
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
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Yuzni ro'yxatdan o'tkazish
              </h1>
              <p className="text-lg text-slate-400">
                Darsda sizni avtomatik taniy olish uchun yuzingizni ro'yxatdan o'tkazing
              </p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-green-400">
                Muvaffaqiyatli ro'yxatdan o'tdingiz! 🎉
              </h1>
              <p className="text-lg text-slate-400">
                Endi darsda sizni avtomatik taniydi
              </p>
            </div>
          )}

          <FaceRegistration
            userId={1} // TODO: Get from auth context
            onRegistrationComplete={handleRegistrationComplete}
          />

          {/* Privacy notice */}
          <div className="mt-8 p-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">
              Maxfiylik haqida
            </h3>
            <p className="text-xs text-slate-400">
              Sizning yuz ma'lumotlaringiz faqat darsda sizni taniy olish uchun ishlatiladi.
              Ma'lumotlar xavfsiz saqlanadi va uchinchi shaxslarga berilmaydi.
              Istalgan vaqtda ro'yxatdan o'chirishingiz mumkin.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}