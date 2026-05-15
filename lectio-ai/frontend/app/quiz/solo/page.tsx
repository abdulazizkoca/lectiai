"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Trophy, Clock, Zap, BookOpen } from "lucide-react";

const CATEGORIES = [
  { id: "math", name: "Matematika", icon: "📐", questions: 15 },
  { id: "physics", name: "Fizika", icon: "⚛️", questions: 12 },
  { id: "chemistry", name: "Kimyo", icon: "🧪", questions: 10 },
  { id: "history", name: "Tarix", icon: "📚", questions: 20 },
  { id: "biology", name: "Biologiya", icon: "🧬", questions: 14 },
  { id: "programming", name: "Dasturlash", icon: "💻", questions: 18 },
];

const DIFFICULTIES = [
  { id: "easy", label: "Oson", color: "#0D9373", questions: 5 },
  { id: "medium", label: "O'rtacha", color: "#F5A623", questions: 10 },
  { id: "hard", label: "Qiyin", color: "#E84855", questions: 15 },
];

export default function SoloQuizPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedCategory || !selectedDifficulty) return;
    router.push(`/student/independent/learn?subject=${selectedCategory}&mode=quiz`);
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,166,35,0.15)", border: "2px solid rgba(245,166,35,0.3)" }}>
            <Zap size={40} style={{ color: "#F5A623" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Solo Test</h1>
          <p className="text-slate-400">Fan va qiyinlikni tanlang va boshlang</p>
        </div>

        {/* Category */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Fan tanlang</h3>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-2xl p-4 text-center border transition-all ${
                  selectedCategory === cat.id
                    ? "border-yellow-400/60 bg-yellow-400/10"
                    : "border-white/10 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <p className="text-xs font-bold">{cat.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{cat.questions} savol</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Qiyinlik darajasi</h3>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((diff) => (
              <motion.button
                key={diff.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`rounded-2xl p-4 text-center border transition-all ${
                  selectedDifficulty === diff.id
                    ? "border-current bg-current/10"
                    : "border-white/10 bg-white/4 hover:bg-white/8"
                }`}
                style={{ borderColor: selectedDifficulty === diff.id ? diff.color : undefined, color: diff.color }}
              >
                <p className="font-bold">{diff.label}</p>
                <p className="text-xs opacity-70 mt-1">{diff.questions} savol</p>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={!selectedCategory || !selectedDifficulty}
          className="w-full py-4 rounded-2xl font-bold text-lg text-black flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: "linear-gradient(135deg,#F5A623,#e8941a)", boxShadow: "0 4px 20px rgba(245,166,35,0.3)" }}
        >
          <Trophy size={20} />
          Testni boshlash
        </motion.button>

        <div className="mt-4 flex items-center justify-center gap-6 text-slate-500 text-xs">
          <span className="flex items-center gap-1"><Clock size={12} /> O'z tempingizda</span>
          <span className="flex items-center gap-1"><Brain size={12} /> AI tekshiradi</span>
          <span className="flex items-center gap-1"><BookOpen size={12} /> Izoh beriladi</span>
        </div>
      </motion.div>
    </div>
  );
}
