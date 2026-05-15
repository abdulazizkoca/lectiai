"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

import { BackButton } from "@/components/ui/BackButton";

export default function QuizJoinPage() {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState<"code" | "name">("code");
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-3xl font-bold text-white">Quiz</h1>
          <p className="text-gray-400 mt-2">Darsga qo'shiling yoki solo test yeching</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "code" ? (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="block text-gray-300 text-sm mb-2">Room kodi</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="TIGER7"
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4
                           text-white text-2xl font-mono tracking-widest text-center
                           focus:border-[#F5A623] focus:outline-none transition"
                autoFocus
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => code.length >= 4 && setStep("name")}
                  className="flex-1 py-4 rounded-xl bg-[#F5A623] text-black font-bold text-lg"
                >
                  Kirish →
                </button>
              </div>
              
              {/* OR scan QR */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative text-center">
                  <span className="px-3 bg-[#0A0A0F] text-gray-500 text-sm">yoki</span>
                </div>
              </div>
              
              <button 
                className="w-full py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition"
                onClick={() => addToast({ title: "Kamera ochilmoqda", description: "QR kod skaneri hozircha faqat mobil ilovada qo'llab-quvvatlanadi", type: "warning" })}
              >
                📷 QR Kodni Skanlash
              </button>
              
              {/* Solo quiz option */}
              <button
                onClick={() => router.push("/quiz/solo")}
                className="w-full mt-3 py-3 rounded-xl border border-white/10 text-gray-500 hover:text-gray-300 transition text-sm"
              >
                Darsiz solo test yechish →
              </button>
            </motion.div>
          ) : (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setStep("code")} className="text-gray-400 text-sm mb-4 flex items-center gap-1">
                ← {code}
              </button>
              <label className="block text-gray-300 text-sm mb-2">Laqabingiz</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Jasur, Dilnoza..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4
                           text-white text-xl focus:border-[#F5A623] focus:outline-none transition"
                autoFocus
              />
              <button
                onClick={() => nickname.trim() && router.push(`/quiz/${code}?name=${nickname}`)}
                className="w-full mt-4 py-4 rounded-xl bg-[#F5A623] text-black font-bold text-lg"
              >
                Kirish ⚡
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
