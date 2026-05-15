"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ThumbsUp, HelpCircle, Flame, Heart, Star } from "lucide-react";

interface Reaction {
  id: string;
  type: "lightbulb" | "thumbsup" | "question" | "fire" | "heart" | "star";
  timestamp: number;
  userId?: string;
}

interface ReactionSystemProps {
  onReaction: (reaction: Omit<Reaction, "id" | "timestamp">) => void;
  reactions?: Reaction[];
  maxVisible?: number;
}

const REACTIONS = [
  { id: "lightbulb", icon: Lightbulb, label: "G'oya!", color: "#F5A623", type: "lightbulb" as const },
  { id: "thumbsup", icon: ThumbsUp, label: "Yaxshi", color: "#0D9373", type: "thumbsup" as const },
  { id: "question", icon: HelpCircle, label: "Savol", color: "#1B4FD8", type: "question" as const },
  { id: "fire", icon: Flame, label: "Ajoyib!", color: "#E84855", type: "fire" as const },
  { id: "heart", icon: Heart, label: "Yoqdi", color: "#EC4899", type: "heart" as const },
  { id: "star", icon: Star, label: "Zo'r", color: "#8B5CF6", type: "star" as const }
];

export function ReactionSystem({ onReaction, reactions = [], maxVisible = 5 }: ReactionSystemProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([]);

  const handleReaction = (type: Reaction["type"]) => {
    const newReaction: Omit<Reaction, "id" | "timestamp"> = {
      type,
      userId: "current-user" // In real app, this would be actual user ID
    };
    
    onReaction(newReaction);
    
    // Add to floating reactions for visual feedback
    const floatingReaction: Reaction = {
      id: Date.now().toString(),
      type,
      timestamp: Date.now(),
      userId: "current-user"
    };
    
    setFloatingReactions(prev => [...prev, floatingReaction]);
    
    // Remove floating reaction after animation
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== floatingReaction.id));
    }, 3000);
    
    setShowPanel(false);
  };

  const visibleReactions = reactions.slice(-maxVisible);

  return (
    <div className="relative">
      {/* Floating Reactions */}
      <div className="fixed bottom-20 right-6 pointer-events-none">
        <AnimatePresence>
          {floatingReactions.map((reaction) => {
            const reactionConfig = REACTIONS.find(r => r.id === reaction.type);
            if (!reactionConfig) return null;
            
            return (
              <motion.div
                key={reaction.id}
                initial={{ y: 0, opacity: 0, scale: 0 }}
                animate={{ 
                  y: -100, 
                  opacity: [0, 1, 1, 0], 
                  scale: [0, 1.2, 1, 0.8]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 3,
                  ease: "easeOut"
                }}
                className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
                style={{ backgroundColor: reactionConfig.color }}
              >
                <reactionConfig.icon size={24} className="text-white" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Reaction Button */}
      <motion.button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-6 right-6 p-3 bg-[#18181F] text-slate-400 rounded-full shadow-lg hover:bg-slate-700 hover:text-white transition-colors z-40"
        whileTap={{ scale: 0.9 }}
      >
        <Heart size={20} />
      </motion.button>

      {/* Reaction Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-6 bg-[#18181F] border border-slate-700 rounded-2xl p-4 shadow-2xl z-40"
          >
            <div className="grid grid-cols-3 gap-3">
              {REACTIONS.map((reaction) => (
                <motion.button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.type)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-700 transition-colors"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <reaction.icon 
                    size={24} 
                    className="mb-1" 
                    style={{ color: reaction.color }}
                  />
                  <span className="text-xs text-slate-300">{reaction.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Reactions Stream */}
      {visibleReactions.length > 0 && (
        <div className="fixed top-24 right-6 max-w-xs">
          <div className="bg-[#18181F]/80 backdrop-blur-sm border border-slate-700 rounded-xl p-3">
            <div className="space-y-2">
              {visibleReactions.map((reaction) => {
                const reactionConfig = REACTIONS.find(r => r.id === reaction.type);
                if (!reactionConfig) return null;
                
                return (
                  <motion.div
                    key={reaction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <reactionConfig.icon 
                      size={16} 
                      style={{ color: reactionConfig.color }}
                    />
                    <span className="text-slate-300">
                      {reaction.userId === "current-user" ? "Siz" : "Boshqa talaba"}
                    </span>
                    <span className="text-slate-500">
                      {reactionConfig.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
