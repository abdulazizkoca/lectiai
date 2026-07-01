"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";

// Mock Wrapped Data
const WRAPPED_SLIDES = [
  {
    id: 1,
    title: "Sizning yilingiz",
    subtitle: "Lectio AI bilan",
    bg: "from-lapis to-[#0A0A0F]",
    content: <div className="text-center"><h2 className="text-6xl font-black font-display mb-4 text-saffron">2026</h2><p className="text-xl font-bold">Bu yil siz ta'limda mo'jizalar yaratdingiz.</p></div>
  },
  {
    id: 2,
    title: "O'qish vaqti",
    subtitle: "Tinimsiz harakat",
    bg: "from-jade to-[#0A0A0F]",
    content: <div className="text-center"><h2 className="text-7xl font-black font-display mb-2 text-white">142</h2><p className="text-2xl font-bold text-white/80">soat</p><p className="mt-6 text-lg">Bu 5 ta Marvel kinosini ko'rish bilan teng! 🍿</p></div>
  },
  {
    id: 3,
    title: "Sizning xarakteringiz",
    subtitle: "AI tahlili",
    bg: "from-amethyst to-[#0A0A0F]",
    content: <div className="text-center"><div className="text-6xl mb-4">🏃‍♂️</div><h2 className="text-4xl font-black font-display mb-4 text-saffron">Sprint Master</h2><p className="text-lg">Siz odatda darslarni 15 daqiqalik tezkor sessiyalarda o'zlashtirasiz.</p></div>
  },
  {
    id: 4,
    title: "Ulashish",
    subtitle: "Natijalaringiz",
    bg: "from-coral to-saffron",
    content: (
      <div className="w-full max-w-sm bg-[#0A0A0F]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h3 className="font-display font-bold text-2xl text-center mb-6">Lectio Wrapped</h3>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">XP</span><span className="font-bold text-saffron">85,400</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">Top Fan</span><span className="font-bold text-jade">Matematika</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">Max Streak</span><span className="font-bold text-lapis">42 kun</span></div>
          <div className="flex justify-between"><span className="text-white/60">Daraja</span><span className="font-bold text-amethyst">Top 5%</span></div>
        </div>
      </div>
    )
  }
];

export default function LectioWrappedPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { success } = useToast();

  const nextSlide = () => {
    if (currentSlide < WRAPPED_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const slide = WRAPPED_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col font-body">
      
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
        {WRAPPED_SLIDES.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: i < currentSlide ? "100%" : "0%" }}
              animate={{ width: i <= currentSlide ? "100%" : "0%" }}
              transition={{ duration: i === currentSlide ? 5 : 0, ease: "linear" }}
              onAnimationComplete={() => {
                if (i === currentSlide) nextSlide();
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col`}
          onClick={nextSlide}
        >
          {/* Header */}
          <div className="pt-12 px-6 flex items-center gap-2 text-white/80">
            <Sparkles size={20} className="text-saffron" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">{slide.subtitle}</p>
              <h1 className="font-bold text-lg">{slide.title}</h1>
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            {slide.content}
          </div>

          {/* Bottom actions on last slide */}
          {currentSlide === WRAPPED_SLIDES.length - 1 && (
            <div className="pb-12 px-6 flex gap-4 z-50" onClick={e => e.stopPropagation()}>
              <Button 
                variant="secondary" 
                className="flex-1 bg-black/50 backdrop-blur-md" 
                leftIcon={<Download />}
                onClick={() => success("Yuklanmoqda...", "Rasm qurilmangizga saqlanmoqda")}
              >
                Yuklash
              </Button>
              <Button
                variant="primary"
                className="flex-1 shadow-[0_0_30px_rgba(245,166,35,0.4)]"
                leftIcon={<Share2 />}
                onClick={() => success("Ulashish", "Havola nusxalandi!")}
              >
                Ulashish
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
