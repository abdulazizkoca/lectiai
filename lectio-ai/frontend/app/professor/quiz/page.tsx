"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

const MOCK_NAMES = ["Jasur", "Malika", "Aziz", "Dilnoza", "Sardor", "Gulnora", "Bobur", "Zulfiya"];

const DEMO_QUESTIONS = [
  { question: "Algoritm nima?", options: ["A) Aniq qadamlar", "B) Dastur", "C) Baza", "D) Protokol"], correct: "A", explanation: "Algoritm — aniq qadamlar ketma-ketligi", time_limit: 20, points: 100 },
  { question: "Binary Search murakkabligi?", options: ["A) O(n)", "B) O(log n)", "C) O(n²)", "D) O(1)"], correct: "B", explanation: "Har qadamda yarmiga qisqartiradi", time_limit: 25, points: 150 },
  { question: "Stack qaysi printsipda ishlaydi?", options: ["A) FIFO", "B) LIFO", "C) Random", "D) Priority"], correct: "B", explanation: "LIFO — Last In, First Out", time_limit: 20, points: 100 },
  { question: "Saralash algoritmi emas?", options: ["A) Bubble Sort", "B) Quick Sort", "C) Binary Search", "D) Merge Sort"], correct: "C", explanation: "Binary Search — qidiruv algoritmi", time_limit: 20, points: 120 },
  { question: "Hash Table qidirish O(1)?", options: ["A) To'g'ri", "B) Noto'g'ri"], correct: "A", explanation: "O'rtacha holda O(1)", time_limit: 15, points: 100 },
];

type Phase = "create" | "waiting" | "question" | "results" | "ended";

export default function ProfessorQuizPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const [roomCode, setRoomCode] = useState(() => "LECTIO-" + Math.random().toString(36).substring(2, 6).toUpperCase());
  const [participants, setParticipants] = useState<{ name: string; score: number }[]>([]);
  const [phase, setPhase] = useState<Phase>("create");
  const [qIdx, setQIdx] = useState(-1);
  const [answerCount, setAnswerCount] = useState(0);
  const [results, setResults] = useState<{ option_counts: Record<string, number>; correct: string; explanation: string; leaderboard: { name: string; score: number }[] } | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [selectedQuestions] = useState(DEMO_QUESTIONS);

  const createQuiz = () => {
    if (!quizTitle.trim()) {
      addToast({ title: "Xato", description: "Quiz nomini kiriting", type: "error" });
      return;
    }
    setPhase("waiting");
    // Simulate participants joining automatically in demo mode
    const shuffled = MOCK_NAMES.sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 4));
    let i = 0;
    const iv = setInterval(() => {
      if (i >= shuffled.length) { clearInterval(iv); return; }
      setParticipants((prev) => [...prev, { name: shuffled[i], score: 0 }]);
      i++;
    }, 700);
  };

  const startQuiz = () => {
    if (participants.length === 0) {
      addToast({ title: "Kutish", description: "Kamida 1 ishtirokchi kerak", type: "warning" });
      return;
    }
    // Start the in-page quiz flow instead of navigating away
    nextQuestion();
  };

  const nextQuestion = () => {
    const idx = qIdx + 1;
    if (idx >= selectedQuestions.length) { setPhase("ended"); return; }
    setQIdx(idx); setAnswerCount(0); setResults(null); setPhase("question");
    // Simulate answers coming in
    let count = 0;
    const iv = setInterval(() => {
      count++; setAnswerCount(count);
      if (count >= participants.length) clearInterval(iv);
    }, 800);
  };

  const endQuestion = () => {
    const q = selectedQuestions[qIdx];
    const counts: Record<string, number> = {};
    q.options.forEach((o) => { counts[o[0]] = Math.floor(Math.random() * participants.length); });
    counts[q.correct] = Math.max(counts[q.correct] || 0, 2);
    setResults({
      option_counts: counts, correct: q.correct, explanation: q.explanation,
      leaderboard: participants.map((p) => ({ ...p, score: p.score + Math.floor(Math.random() * 150) })).sort((a, b) => b.score - a.score),
    });
    setPhase("results");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Header */}
      <div className="bg-[#18181F] border-b border-slate-800 p-4 px-6 flex justify-between items-center">
        <Link href="/professor/dashboard" className="flex items-center gap-2 text-white hover:text-[#F5A623] transition-colors">
          <span className="text-xl">🎓</span>
          <span className="font-bold text-xl">Lectio AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-[#F5A623]/10 text-[#F5A623] px-4 py-2 rounded-lg border border-[#F5A623]/20">
            <span className="text-sm font-bold uppercase tracking-wider block leading-none mb-1">Xona kodi</span>
            <span className="text-2xl font-mono font-bold leading-none">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span>👥</span>
            <span className="text-xl font-bold">{participants.length}</span>
            <span className="text-sm">o'quvchi</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {/* CREATE PHASE */}
          {phase === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <Card className="p-8">
                <h1 className="text-3xl font-bold text-center mb-8">🎯 Yangi Quiz Yaratish</h1>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Quiz nomi</label>
                    <Input
                      label=""
                      placeholder="Masalan: Algoritmlar testi"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Xona kodi</label>
                    <div className="flex items-center gap-2">
                      <Input value={roomCode} readOnly />
                      <Button 
                        variant="secondary" 
                        onClick={() => setRoomCode("LECTIO-" + Math.random().toString(36).substring(2, 6).toUpperCase())}
                      >
                        🔄
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Savollar ({selectedQuestions.length} ta)</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedQuestions.map((q, i) => (
                        <div key={i} className="bg-slate-800 p-3 rounded-lg text-sm">
                          <span className="text-[#F5A623] font-bold">{i + 1}.</span> {q.question}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={createQuiz}
                    disabled={!quizTitle.trim()}
                  >
                    Quizni Yaratish va Boshlash
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* WAITING */}
          {phase === "waiting" && (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-4">O'quvchilar kuting...</h2>
              <p className="text-slate-400 mb-8">O'quvchilar quyidagi kod orqali qo'shilishi mumkin:</p>
              
              <div className="bg-[#F5A623]/10 border-2 border-[#F5A623]/20 rounded-xl p-8 mb-8">
                <p className="text-sm text-[#F5A623] font-bold mb-2">Xona kodi</p>
                <p className="text-5xl font-mono font-bold text-[#F5A623]">{roomCode}</p>
              </div>
              
              <div className="mb-8">
                <p className="text-slate-400 mb-4">Qo'shilgan o'quvchilar ({participants.length}):</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {participants.map((p, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className="bg-[#18181F] px-4 py-2 rounded-full text-sm font-bold"
                    >
                      {p.name}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="primary" 
                size="lg"
                onClick={startQuiz}
                disabled={participants.length === 0}
              >
                🚀 Quizni Boshlash ({participants.length} o'quvchi)
              </Button>
            </motion.div>
          )}

          {/* QUESTION */}
          {phase === "question" && qIdx >= 0 && (
            <motion.div key={`q${qIdx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ maxWidth: 700, width: "100%" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-lg)", padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: 20 }}>
                  {DEMO_QUESTIONS[qIdx].question}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {DEMO_QUESTIONS[qIdx].options.map((opt) => (
                    <div key={opt} style={{ padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", fontSize: "0.9rem" }}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
              {/* Answer progress */}
              <div style={{ marginBottom: 24 }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(answerCount / participants.length) * 100}%` }} />
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 8 }}>
                  {answerCount} / {participants.length} javob berdi
                </p>
              </div>
              <motion.button onClick={endQuestion} className="btn-primary" style={{ width: "100%" }}
                whileTap={{ scale: 0.97 }}>
                Savolni Tugatish
              </motion.button>
            </motion.div>
          )}

          {/* RESULTS */}
          {phase === "results" && results && (
            <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ maxWidth: 700, width: "100%" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: 20, textAlign: "center" }}>Natijalar</h3>
              {/* Distribution */}
              <div style={{ marginBottom: 24 }}>
                {Object.entries(results.option_counts).map(([opt, count]) => (
                  <div key={opt} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ width: 24, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{opt}</span>
                    <div style={{ flex: 1, height: 32, background: "rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: `${participants.length ? ((count as number) / participants.length) * 100 : 0}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ height: "100%", borderRadius: 8,
                          background: opt === results.correct ? "var(--jade)" : "rgba(255,255,255,0.15)" }} />
                    </div>
                    <span style={{ width: 24, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{count as number}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(13,147,115,0.15)", border: "1px solid rgba(13,147,115,0.3)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 24 }}>
                <p style={{ fontWeight: 700, color: "var(--jade)" }}>✓ To&apos;g&apos;ri: {results.correct}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 4 }}>{results.explanation}</p>
              </div>
              {/* Mini leaderboard */}
              {results.leaderboard.slice(0, 3).map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", marginBottom: 4 }}>
                  <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span style={{ flex: 1 }}>{p.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{p.score}</span>
                </div>
              ))}
              <motion.button onClick={qIdx < DEMO_QUESTIONS.length - 1 ? nextQuestion : () => setPhase("ended")}
                className="join-btn" style={{ marginTop: 24 }} whileTap={{ scale: 0.95 }}>
                {qIdx < DEMO_QUESTIONS.length - 1 ? "Keyingi Savol →" : "Testni Yakunlash 🏆"}
              </motion.button>
            </motion.div>
          )}

          {/* ENDED */}
          {phase === "ended" && (
            <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", maxWidth: 500 }}>
              <div style={{ fontSize: "4rem", marginBottom: 16 }}>🏆</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: 24 }}>Test yakunlandi!</h2>
              <Link href="/professor/dashboard" className="join-btn" style={{ display: "inline-block", textDecoration: "none" }}>
                Dashboard ga qaytish
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
