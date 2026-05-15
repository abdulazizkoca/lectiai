"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { ChevronRight, ArrowLeft, Heart, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Visual Novel Scenario Mock
const SCENARIO_DATA = {
  id: "history-1",
  subject: "Tarix",
  title: "Amir Temur Qarorlari",
  bgGradient: "from-amber-900/40 to-[#0A0A0F]",
  nodes: {
    "start": {
      character: "Amir Temur",
      text: "Yangi hududlarni zabt etishdan oldin, qo'shin ta'minotini qanday hal qilamiz? Uzoq yurish bizni zaiflashtirishi mumkin.",
      choices: [
        { text: "Mahalliy aholidan oziq-ovqat yig'ish", next: "wrong_1" },
        { text: "O'zimiz bilan katta karvon olib yurish", next: "wrong_2" },
        { text: "Oldindan tayyorlangan logistika bazalarini qurish", next: "correct_1" }
      ]
    },
    "wrong_1": {
      character: "Maslahatchi",
      text: "Bu qaror mahalliy aholi isyoniga sabab bo'lishi mumkin va qo'shin obro'siga putur yetkazadi.",
      isConsequence: true,
      nextAuto: "start"
    },
    "wrong_2": {
      character: "Qo'mondon",
      text: "Katta karvon qo'shinning tezligini pasaytiradi. Biz dushmanga kutilmaganda zarba bera olmaymiz.",
      isConsequence: true,
      nextAuto: "start"
    },
    "correct_1": {
      character: "Amir Temur",
      text: "Juda to'g'ri. Tayanch nuqtalar orqali biz tezkor harakatlanamiz va dushmanni esankiratib qo'yamiz. Bu strategiya tarixdagi eng muvaffaqiyatli yurishlarimizga asos bo'ldi.",
      isSuccess: true,
      xp: 50,
      nextAuto: "end"
    },
    "end": {
      character: "Ssenariy Yakunlandi",
      text: "Tabriklaymiz! Siz tarixiy strategiyani to'g'ri tahlil qildingiz.",
      isEnd: true
    }
  }
};

export default function ScenarioGamePage() {
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const node = (SCENARIO_DATA.nodes as any)[currentNodeId];

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setIsTyping(true);
    setDisplayedText("");
    
    const textToType = node.text;
    const interval = setInterval(() => {
      setDisplayedText(textToType.substring(0, i));
      i++;
      if (i > textToType.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30); // 30ms per char

    return () => clearInterval(interval);
  }, [currentNodeId, node.text]);

  const handleChoice = (choice: any) => {
    if (isTyping) {
      // Skip typing if clicked early
      setDisplayedText(node.text);
      setIsTyping(false);
      return;
    }
    setCurrentNodeId(choice.next);
  };

  const handleContinue = () => {
    if (node.isSuccess) setXpEarned(prev => prev + (node.xp || 0));
    if (node.nextAuto) setCurrentNodeId(node.nextAuto);
  };

  return (
    <div className={`min-h-[100dvh] bg-[#0A0A0F] text-white flex flex-col font-body bg-gradient-to-br ${SCENARIO_DATA.bgGradient} relative overflow-hidden`}>
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/student/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-bold">
          <ArrowLeft size={20} /> Qaytish
        </Link>
        <div className="flex items-center gap-4 font-bold">
          <span className="flex items-center gap-1 text-[#0D9373] bg-[#0D9373]/10 px-3 py-1 rounded-full border border-[#0D9373]/20">
            <Zap size={16} fill="currentColor" /> {xpEarned} XP
          </span>
        </div>
      </div>

      {/* Main Illustration Area */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        {/* Abstract shape representing character/scene */}
        <motion.div 
          key={node.character}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-64 h-96 border-4 border-white/10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-full opacity-50" />
          <h2 className="text-3xl font-display font-bold rotate-[-90deg] tracking-widest text-white/20 whitespace-nowrap">
            {node.character.toUpperCase()}
          </h2>
        </motion.div>
      </div>

      {/* Dialog Box */}
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full z-10 shrink-0 mb-4">
        
        <AnimatePresence mode="wait">
          {node.isConsequence || node.isSuccess ? (
            <motion.div 
              key="consequence"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`p-6 rounded-2xl border-2 mb-6 ${node.isSuccess ? 'bg-[#0D9373]/10 border-[#0D9373]/30' : 'bg-[#E84855]/10 border-[#E84855]/30'}`}
            >
              <h3 className={`font-bold uppercase tracking-wider text-sm mb-2 ${node.isSuccess ? 'text-[#0D9373]' : 'text-[#E84855]'}`}>
                {node.isSuccess ? "To'g'ri qaror!" : "Xato tanlov"}
              </h3>
              <p className="text-lg leading-relaxed">{displayedText}</p>
              
              {!isTyping && !node.isEnd && (
                <div className="mt-6 flex justify-end">
                  <Button variant="primary" onClick={handleContinue} rightIcon={<ChevronRight size={18} />}>
                    Davom etish
                  </Button>
                </div>
              )}
            </motion.div>
          ) : node.isEnd ? (
            <motion.div 
              key="end"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl"
            >
              <h2 className="text-4xl font-display font-bold mb-4 text-[#F5A623]">{node.character}</h2>
              <p className="text-xl mb-8">{displayedText}</p>
              <Link href="/student/dashboard">
                <Button variant="premium" size="lg">Bosh sahifaga qaytish</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              key="dialog"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-[#18181F]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              {/* Character Name Tag */}
              <div className="absolute -top-4 left-8 bg-[#F5A623] text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg">
                {node.character}
              </div>

              <div className="min-h-[100px] mb-8 mt-2">
                <p className="text-xl md:text-2xl leading-relaxed font-body">
                  {displayedText}
                  {isTyping && <span className="inline-block w-2 h-5 bg-[#F5A623] ml-1 animate-pulse" />}
                </p>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-3">
                {node.choices && node.choices.map((choice: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(choice)}
                    disabled={isTyping}
                    className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#F5A623]/50 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-between"
                  >
                    <span>{choice.text}</span>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-[#F5A623] transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
