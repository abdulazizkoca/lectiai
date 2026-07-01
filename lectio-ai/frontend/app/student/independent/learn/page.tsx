"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, Brain, FileText, Map, Trophy, Send, Mic, Settings, ChevronLeft, BookOpen, Target
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  generateFlashcards, 
  generateQuizFromCards, 
  completeLearningChain,
  Flashcard,
  QuizQuestion,
  QuizResultItem
} from "@/lib/learningChainApi";

type LearningMode = "tutor" | "flashcards" | "quiz" | "mindmap" | "summary";

const MODES = [
  { id: "tutor", name: "AI Usto", icon: MessageCircle },
  { id: "flashcards", name: "Flashcards", icon: Brain },
  { id: "quiz", name: "Mini Test", icon: Trophy },
  { id: "mindmap", name: "Aqli xarita", icon: Map },
  { id: "summary", name: "Xulosa", icon: FileText }
];

export default function LearnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<LearningMode>((searchParams.get("mode") as LearningMode) || "tutor");
  
  const [topic, setTopic] = useState(() => {
    const topicParam = searchParams.get("topic");
    const fileParam = searchParams.get("file");
    const subjectName = searchParams.get("subjectName");
    if (topicParam) return topicParam;
    if (subjectName) return subjectName;
    if (fileParam) return `Yuklangan fayl: ${fileParam}`;
    return "Yangi mavzu";
  });

  // Chain States
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<number[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    // Get user from token or localStorage
    const token = localStorage.getItem("lectio_token");
    if (token) {
      // Decode JWT token directly (simplified) or fetch from /api/auth/me
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setStudentId(payload.sub ? parseInt(payload.sub) : payload.user_id ? parseInt(payload.user_id) : 1);
      } catch (e) {
        setStudentId(1); // fallback
      }
    } else {
      setStudentId(1); // fallback for dev
    }
  }, []);

  const handleModeSwitch = (newMode: LearningMode) => {
    setMode(newMode);
  };

  const renderModeContent = () => {
    if (!studentId) return <div className="p-8 text-center">Yuklanmoqda...</div>;

    switch (mode) {
      case "tutor":
        return <TutorMode 
                 topic={topic} 
                 studentId={studentId} 
                 onGenerateCards={(cards, ids) => {
                   setFlashcards(cards);
                   setSavedFlashcardIds(ids);
                   setMode("flashcards");
                 }} 
               />;
      case "flashcards":
        return <FlashcardsMode 
                 topic={topic} 
                 flashcards={flashcards}
                 onGenerateQuiz={async () => {
                   if(flashcards.length === 0) return;
                   const res = await generateQuizFromCards({ topic, flashcards });
                   setQuizQuestions(res.questions);
                   setMode("quiz");
                 }}
               />;
      case "quiz":
        return <QuizMode 
                 topic={topic} 
                 questions={quizQuestions}
                 studentId={studentId}
                 flashcardIds={savedFlashcardIds}
               />;
      case "mindmap": return <MindMapMode topic={topic} />;
      case "summary": return <SummaryMode topic={topic} />;
      default: return <TutorMode topic={topic} studentId={studentId} onGenerateCards={()=>{}} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      <div className="bg-[#18181F] border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/student/independent")} className="p-2 hover:bg-[#0A0A0F] rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{topic}</h1>
              <p className="text-slate-400 text-sm">Mustaqil o'qish zanjiri</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#18181F] border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => handleModeSwitch(m.id as LearningMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                mode === m.id ? "bg-saffron text-black" : "bg-[#0A0A0F] text-slate-400"
              }`}>
              <m.icon size={18} />
              <span className="font-medium">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
            {renderModeContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// 1. TUTOR MODE
// ============================================================================
function TutorMode({ topic, studentId, onGenerateCards }: { topic: string, studentId: number, onGenerateCards: (cards: Flashcard[], ids: number[]) => void }) {
  const [messages, setMessages] = useState([{ id: 1, type: "assistant", content: `Assalomu alaykum! Men sizning AI ustingizman. ${topic} mavzusini o'rganamiz.` }]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages(p => [...p, { id: Date.now(), type: "user", content: inputValue.trim() }]);
    setInputValue("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now(), type: "assistant", content: "Ajoyib! Bu mavzuni chuqurroq tushunish uchun flashcardlar yaratishni maslahat beraman." }]);
      setIsTyping(false);
    }, 1000);
  };

  const createCards = async () => {
    setIsGenerating(true);
    try {
      const res = await generateFlashcards({ studentId, topic, count: 5 });
      onGenerateCards(res.flashcards, res.savedIds);
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${m.type === "user" ? "bg-saffron text-black" : "bg-[#18181F] text-white"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-slate-400">Yozmoqda...</div>}
      </div>
      
      <div className="mb-4 flex justify-center">
        <Button onClick={createCards} disabled={isGenerating} style={{ background: "#0D9373" }}>
          {isGenerating ? "Flashcardlar yaratilmoqda..." : "Yangi Flashcardlar yaratish →"}
        </Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Savolingizni kiriting..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSendMessage()} className="flex-1" />
        <Button onClick={handleSendMessage}><Send size={18} /></Button>
      </div>
    </div>
  );
}

// ============================================================================
// 2. FLASHCARDS MODE
// ============================================================================
function FlashcardsMode({ topic, flashcards, onGenerateQuiz }: { topic: string, flashcards: Flashcard[], onGenerateQuiz: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <div className="p-8 text-center">Iltimos avval AI Usto orqali flashcardlar yarating.</div>;
  }

  const card = flashcards[currentIndex];

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Takrorlash tugadi!</h3>
        <p className="mb-6">Endi shu bilimingizni Test orqali sinab ko'ramiz.</p>
        <Button onClick={async () => {
          setGeneratingQuiz(true);
          await onGenerateQuiz();
          setGeneratingQuiz(false);
        }} disabled={generatingQuiz} style={{ background: "#1B4FD8" }}>
          {generatingQuiz ? "Test yaratilmoqda..." : "Testga o'tish →"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="mb-4 text-slate-400">{currentIndex + 1} / {flashcards.length}</div>
      <div className="relative w-full max-w-2xl h-64 mb-6 cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.4 }} className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 bg-[#18181F] rounded-2xl flex flex-col items-center justify-center p-8 border-2 border-slate-700" style={{ backfaceVisibility: "hidden" }}>
            <p className="text-slate-500 mb-2">SAVOL</p>
            <h3 className="text-xl font-bold text-center">{card.front}</h3>
          </div>
          <div className="absolute inset-0 bg-saffron text-black rounded-2xl flex flex-col items-center justify-center p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <p className="text-black/60 mb-2">JAVOB</p>
            <h3 className="text-xl font-bold text-center">{card.back}</h3>
          </div>
        </motion.div>
      </div>
      {isFlipped && (
        <Button onClick={(e) => { e.stopPropagation(); nextCard(); }}>Keyingisi</Button>
      )}
    </div>
  );
}

// ============================================================================
// 3. QUIZ MODE & CHAIN COMPLETION
// ============================================================================
function QuizMode({ topic, questions, studentId, flashcardIds }: { topic: string, questions: QuizQuestion[], studentId: number, flashcardIds: number[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<QuizResultItem[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [chainResult, setChainResult] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center">Iltimos avval Flashcard qismidan o'ting.</div>;
  }

  const handleAnswer = async (optIdx: number) => {
    const q = questions[currentIdx];
    const isCorrect = optIdx === q.correct;
    const timeTaken = Date.now() - startTime;
    
    const newResults = [...results, { card_index: currentIdx, is_correct: isCorrect, time_ms: timeTaken }];
    setResults(newResults);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setStartTime(Date.now());
    } else {
      // Finish and trigger complete chain
      setCompleting(true);
      try {
        const res = await completeLearningChain({
          studentId,
          topic,
          quizResults: newResults,
          flashcardIds
        });
        setChainResult(res);
      } catch (e) {
        alert("Natijalarni saqlashda xatolik");
      }
      setCompleting(false);
    }
  };

  if (completing) return <div className="p-8 text-center">Natijalar tahlil qilinmoqda...</div>;

  if (chainResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <h2 className="text-3xl font-bold">Natijalar!</h2>
        <div className="text-5xl">{chainResult.quiz_score >= 80 ? '🏆' : '📚'}</div>
        <p className="text-xl">Sizning ballingiz: {chainResult.quiz_score}%</p>
        <div className="bg-[#18181F] p-4 rounded-xl">
          <p>Mavzu o'zlashtirish: {chainResult.progress?.mastery_level}%</p>
          <p>O'sish: +{chainResult.progress?.improvement}%</p>
        </div>
        
        {chainResult.new_achievements?.length > 0 && (
          <div className="border border-yellow-500 p-4 rounded-xl">
            <h4 className="font-bold mb-2">Yangi yutuqlar!</h4>
            {chainResult.new_achievements.map((a: any, i: number) => (
              <div key={i}>{a.icon} {a.title} (+{a.xp} XP)</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const q = questions[currentIdx];
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-slate-400">{currentIdx + 1} / {questions.length}</div>
        <h3 className="text-2xl font-bold mb-8">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left p-4 rounded-xl bg-[#18181F] hover:bg-slate-800 transition-colors border border-slate-700">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stub components for remaining modes
function MindMapMode({ topic }: { topic: string }) { return <div className="p-8 text-center">{topic} aqli xaritasi</div>; }
function SummaryMode({ topic }: { topic: string }) { return <div className="p-8 text-center">{topic} xulosasi</div>; }
