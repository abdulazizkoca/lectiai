"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, Users, Clock, Play, Zap } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function StudentLivePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { success, error, info } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      error("Xona kodi kiritilmadi", "Iltimos, 6 ta belgidan iborat xona kodini kiriting");
      return;
    }
    if (roomCode.trim().length < 4) {
      error("Noto'g'ri kod", "Xona kodi kamida 4 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      success("Muvaffaqiyatli qo'shildingiz!", `${roomCode.toUpperCase()} xonasiga ulanildi`);
      router.push(`/student/live/session/${roomCode.toUpperCase()}`);
    }, 1200);
  };

  const handleScanQR = () => {
    info("QR Kod Skaneri", "QR kod skaneri tez orada qo'shiladi");
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)" }}
    >
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#F5A623" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: "#1B4FD8" }} />

      {/* Decorative orbs */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Hero */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(245,166,35,0.15)", border: "2px solid rgba(245,166,35,0.3)" }}
          >
            <Zap size={44} style={{ color: "#F5A623" }} />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Live Dars</h1>
          <p className="text-slate-400">Professor boshlagan jonli darsga qo'shiling</p>
        </div>

        {/* Code Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 border border-white/10 mb-4"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
        >
          <label className="block text-sm font-bold text-slate-300 mb-3">
            Xona kodini kiriting
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder="Masalan: TIGER7"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={6}
            className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-4 rounded-2xl border border-white/10 bg-white/5 text-yellow-400 placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={!roomCode.trim() || isJoining}
            className="w-full mt-4 py-4 rounded-2xl font-bold text-lg text-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}
          >
            {isJoining ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Qo'shilmoqda...
              </>
            ) : (
              <>
                <Play size={20} fill="black" />
                Darsga qo'shilish
              </>
            )}
          </motion.button>
        </motion.div>

        {/* QR Divider */}
        <div className="text-center my-4">
          <span className="text-slate-500 text-sm">yoki</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleScanQR}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 border border-white/10 hover:bg-white/8 transition-all"
        >
          <QrCode size={20} style={{ color: "#F5A623" }} />
          QR Kodni skanerlash
        </motion.button>

        {/* Info Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>Sinfdoshlaringiz bilan ulaning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>Jonli efir</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
