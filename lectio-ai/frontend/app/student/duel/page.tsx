"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Swords, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

export default function DuelModePage() {
  const [isSearching, setIsSearching] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [opponent, setOpponent] = useState<{
    name: string;
    level: number;
    avatar: string;
    streak: number;
  } | null>(null);

  // Simulate matchmaking
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setOpponent({ name: "Jasur Karimov", level: 14, avatar: "JK", streak: 5 });
    }, 3000);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-body items-center justify-center relative overflow-hidden p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-coral/10 rounded-full blur-[100px] pointer-events-none" />

      {opponent ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-4xl flex flex-col items-center z-10"
        >
          <div className="text-coral mb-12"><Swords size={64} /></div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full">
            
            {/* You */}
            <div className="flex flex-col items-center">
              <Avatar initials="SD" size="xl" className="border-4 border-lapis mb-4 shadow-[0_0_30px_rgba(27,79,216,0.5)]" />
              <h2 className="text-2xl font-bold font-display text-white">Siz</h2>
              <p className="text-saffron font-bold mt-1">Daraja 12</p>
            </div>

            {/* VS */}
            <div className="text-4xl md:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-saffron to-coral italic tracking-widest my-8 md:my-0">
              VS
            </div>

            {/* Opponent */}
            <div className="flex flex-col items-center">
              <Avatar initials={opponent.avatar} size="xl" className="border-4 border-coral mb-4 shadow-[0_0_30px_rgba(232,72,85,0.5)]" />
              <h2 className="text-2xl font-bold font-display text-white">{opponent.name}</h2>
              <p className="text-saffron font-bold mt-1">Daraja {opponent.level}</p>
            </div>

          </div>

          <div className="mt-20">
            <Button 
              variant="premium" 
              size="xl" 
              className="animate-pulse px-16 text-2xl shadow-[0_0_40px_rgba(245,166,35,0.4)]"
              onClick={() => {
                addToast({ title: "Jang boshlanmoqda...", description: "Duel serveriga ulanilmoqda", type: "info" });
              }}
            >
              Jangni Boshlash
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="w-full max-w-md z-10 flex flex-col items-center">
          <div className="mb-8 relative">
            <Swords size={80} style={{ color: "var(--muted-foreground)" }} />
            {isSearching && (
              <motion.div 
                className="absolute inset-0 border-4 border-coral rounded-full"
                animate={{ scale: [1, 2], opacity: [1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          
          <h1 className="text-4xl font-display font-black text-center mb-4 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-saffron to-coral">
            Duel Mode
          </h1>
          <p className="text-center mb-10" style={{ color: "var(--muted-foreground)" }}>
            Kursdoshlaringizga yakkama-yakka jang e&apos;lon qiling va bilimingizni sinang. G&apos;olibga katta XP beriladi!
          </p>

          <div className="w-full space-y-4">
            <Button 
              variant="premium" 
              size="lg" 
              className="w-full text-lg" 
              onClick={handleSearch}
              isLoading={isSearching}
            >
              {isSearching ? "Raqib qidirilmoqda..." : "Tasodifiy Raqib Topish"}
            </Button>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink-0 mx-4 text-sm font-bold" style={{ color: "var(--muted-foreground)" }}>YOKI</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <Input 
              label="Talaba ismi yoki ID" 
              leftIcon={<Search size={18} />}
              inputSize="lg"
            />
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full text-lg border-white/10 hover:border-saffron/50"
              onClick={() => {
                addToast({ title: "Chaqiruv yuborildi", description: "Talaba tasdiqlashi kutilmoqda", type: "success" });
              }}
            >
              Chaqiruv tashlash
            </Button>
          </div>

          <Link href="/student/dashboard" className="mt-12 font-bold transition-colors hover:text-saffron" style={{ color: "var(--muted-foreground)" }}>
            Ortga qaytish
          </Link>
        </div>
      )}
    </div>
  );
}
