"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, ThumbsUp } from "lucide-react";

interface ConfusionButtonProps {
  onConfusionToggle: (isConfused: boolean) => void;
  isConfused?: boolean;
}

export function ConfusionButton({ onConfusionToggle, isConfused = false }: ConfusionButtonProps) {
  const [localConfused, setLocalConfused] = useState(isConfused);

  const handleToggle = () => {
    const newState = !localConfused;
    setLocalConfused(newState);
    onConfusionToggle(newState);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className={`fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all z-40 ${
        localConfused 
          ? "bg-[#E84855] text-white scale-110" 
          : "bg-[#18181F] text-slate-400 hover:bg-slate-700 hover:text-white"
      }`}
      whileTap={{ scale: 0.9 }}
      animate={{ 
        scale: localConfused ? [1, 1.1, 1] : 1,
        backgroundColor: localConfused ? "#E84855" : "#18181F"
      }}
      transition={{ 
        scale: { duration: 0.3, repeat: localConfused ? Infinity : 0, repeatDelay: 1 },
        backgroundColor: { duration: 0.3 }
      }}
    >
      {localConfused ? (
        <div className="flex items-center gap-2">
          <HelpCircle size={20} />
          <span className="text-sm font-bold">Tushunarsiz</span>
        </div>
      ) : (
        <HelpCircle size={20} />
      )}
    </motion.button>
  );
}
