"use client";

import React, { useState } from "react";
import { Camera, Zap, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SnapAndLearnPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCapture = () => {
    setIsScanning(true);
    // Simulate OCR and AI processing delay
    setTimeout(() => {
      setIsScanning(false);
      setResults([
        { q: "Nyutonning birinchi qonuni nima?", a: "Inersiya qonuni - jismga kuch ta'sir etmaguncha u o'z holatini saqlaydi." },
        { q: "Nyutonning ikkinchi qonuni formulasi?", a: "F = m * a (Kuch = massa * tezlanish)" },
        { q: "Kuch qanday o'lchov birligida o'lchanadi?", a: "Nyuton (N) da o'lchanadi." }
      ]);
    }, 3000);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0F] text-white flex flex-col font-body relative">
      
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full">
        <Link href="/student/dashboard" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-lg text-white">Snap & Learn</h1>
        <div className="w-10" />
      </div>

      {results.length > 0 ? (
        <div className="flex-1 p-6 pt-24 max-w-2xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0D9373]/20 text-[#0D9373] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-[#0D9373]">Muvaffaqiyatli!</h2>
            <p className="text-slate-400 mt-2">Darslikdan {results.length} ta flashcard yaratildi.</p>
          </motion.div>

          <div className="space-y-4 mb-8">
            {results.map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-[#18181F] p-4 rounded-2xl border border-slate-800"
              >
                <p className="font-bold mb-2 pb-2 border-b border-slate-800 text-[#F5A623]">Q: {card.q}</p>
                <p className="text-slate-300">A: {card.a}</p>
              </motion.div>
            ))}
          </div>

          <Button 
            variant="premium" 
            size="lg" 
            className="w-full text-lg shadow-[0_0_30px_rgba(245,166,35,0.3)]"
            onClick={() => {
              const addToast = (window as any).__addToast;
              if (addToast) addToast({ title: "Qo'shildi!", description: "Flashcardlar darsingizga saqlandi", type: "success" });
            }}
          >
            Dasturga qo'shish
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative p-6">
          
          {/* Simulated Camera View */}
          <div className="absolute inset-0 bg-slate-900 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Book" className="w-full h-full object-cover opacity-50 blur-sm" />
          </div>

          {/* Scanning Overlay */}
          <div className="relative z-10 w-full max-w-sm aspect-[3/4] border-2 border-[#F5A623]/50 rounded-3xl flex items-center justify-center overflow-hidden">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5A623] rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F5A623] rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F5A623] rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5A623] rounded-br-3xl" />

            {isScanning ? (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5A623]/30 to-transparent"
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <p className="text-[#F5A623] font-bold text-center px-4 bg-black/50 py-2 rounded-lg backdrop-blur-md">
                Darslik sahifasini shu ramkaga kiriting
              </p>
            )}
          </div>

          <div className="relative z-10 mt-12 flex flex-col items-center">
            <button 
              onClick={handleCapture}
              disabled={isScanning}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 ${isScanning ? 'opacity-50' : 'bg-white/20 backdrop-blur-md'}`}
            >
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black">
                {isScanning ? <Zap className="animate-pulse" /> : <Camera />}
              </div>
            </button>
            <p className="mt-4 text-white/70 font-bold">
              {isScanning ? "AI o'qimoqda..." : "Suratga olish"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
