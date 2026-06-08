"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { Trophy, Clock, Zap, CheckCircle2, XCircle, Users, Crown, Star } from "lucide-react";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type GameStatus = "waiting" | "question" | "answered" | "results" | "ended";

interface Question {
  question: string;
  type?: string;
  options?: string[];
  time_limit: number;
  points?: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  streak?: number;
}

export default function QuizRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomCode = (params.code as string).toUpperCase();
  const nickname = searchParams.get("name") || "O'quvchi";

  const [status, setStatus] = useState<GameStatus>("waiting");
  const [participantCount, setParticipantCount] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_room", { room_code: roomCode, nickname, student_id: null });
    });

    socket.on("connect_error", () => {
      setError("Server bilan ulanib bo'lmadi. Qayta urinib ko'ring.");
    });

    socket.on("error", (data: { message: string }) => {
      setError(data.message || "Xona topilmadi.");
    });

    socket.on("room_joined", (data: { participant_count: number }) => {
      setParticipantCount(data.participant_count);
    });

    socket.on("question_started", (data: { question: Question; time_limit: number }) => {
      setQuestion(data.question);
      const tl = data.question.time_limit || data.time_limit || 30;
      setTimeLeft(tl);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setStatus("question");
      setQuestionStartTime(Date.now());

      if (timerRef.current) clearInterval(timerRef.current);
      let t = tl;
      timerRef.current = setInterval(() => {
        t -= 1;
        setTimeLeft(t);
        if (t <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus("answered");
        }
      }, 1000);
    });

    socket.on("answer_confirmed", (data: {
      is_correct: boolean;
      points_earned: number;
      current_score: number;
      rank: number;
      streak: number;
    }) => {
      setIsCorrect(data.is_correct);
      setLastPoints(data.points_earned);
      setMyScore(data.current_score);
      setMyRank(data.rank);
      setStreak(data.streak);
      setStatus("answered");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    socket.on("question_results", (data: {
      correct_answer: string;
      explanation: string;
      top5_leaderboard: LeaderboardEntry[];
    }) => {
      setCorrectAnswer(data.correct_answer || "");
      setExplanation(data.explanation || "");
      setLeaderboard(data.top5_leaderboard || []);
      setStatus("results");
    });

    socket.on("quiz_ended", (data: { final_leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.final_leaderboard || []);
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.disconnect();
    };
  }, [roomCode, nickname]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer || status !== "question" || !socketRef.current) return;
    setSelectedAnswer(answer);
    const timeTaken = Date.now() - questionStartTime;
    socketRef.current.emit("submit_answer", {
      room_code: roomCode,
      answer,
      time_taken_ms: timeTaken,
    });
  }, [selectedAnswer, status, roomCode, questionStartTime]);

  const timePercent = question ? Math.max(0, (timeLeft / (question.time_limit || 30)) * 100) : 0;
  const timeColor = timeLeft > 10 ? "#0D9373" : timeLeft > 5 ? "#F5A623" : "#E84855";

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white mb-2">Xatolik yuz berdi</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push("/join")} className="px-6 py-3 bg-[#F5A623] text-black rounded-xl font-bold">
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  const OPTION_COLORS = ["#E84855", "#1B4FD8", "#0D9373", "#F5A623", "#7B2FBE"];
  const LETTERS = ["A", "B", "C", "D", "E"];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#e8941a] flex items-center justify-center font-bold text-black">L</div>
          <div>
            <span className="font-mono font-bold text-[#F5A623] text-sm">{roomCode}</span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Users size={10} /> {participantCount} ishtirokchi
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-[#F5A623]" />
            <span className="font-bold">{myScore}</span>
          </div>
          {myRank > 0 && (
            <div className="flex items-center gap-1">
              <Trophy size={14} className="text-amber-400" />
              <span className="font-bold">#{myRank}</span>
            </div>
          )}
          {streak > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
              🔥 {streak}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* WAITING */}
          {status === "waiting" && (
            <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-6"
              >⏳</motion.div>
              <h2 className="text-2xl font-bold mb-2">Dars boshlanishini kuting</h2>
              <p className="text-slate-400 mb-6">Professor test boshlaydi</p>
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 flex items-center justify-center font-bold text-[#F5A623]">
                  {nickname[0]?.toUpperCase()}
                </div>
                <span className="font-bold">{nickname}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <span className={`w-2 h-2 rounded-full inline-block ${connected ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-spin"}`} />
                {connected ? "Ulangan" : "Ulanmoqda..."}
              </div>
            </motion.div>
          )}

          {/* QUESTION */}
          {(status === "question" || status === "answered") && question && (
            <motion.div key="question" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              {/* Timer */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Vaqt</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-lg" style={{ color: timeColor }}>
                    <Clock size={16} /> {timeLeft}s
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: timeColor }}
                    animate={{ width: `${timePercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Question text */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-lg font-bold leading-relaxed">{question.question}</p>
              </div>

              {/* Options */}
              {question.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((opt, i) => {
                    const isSelected = selectedAnswer === LETTERS[i] || selectedAnswer === opt;
                    let border = "border-white/10";
                    let bg = "bg-white/5 hover:bg-white/10 hover:border-white/20";
                    if (isSelected) {
                      if (isCorrect === null) { border = "border-[#F5A623]"; bg = "bg-[#F5A623]/10"; }
                      else if (isCorrect) { border = "border-[#0D9373]"; bg = "bg-[#0D9373]/10"; }
                      else { border = "border-[#E84855]"; bg = "bg-[#E84855]/10"; }
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={!selectedAnswer ? { scale: 1.02 } : {}}
                        whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(LETTERS[i])}
                        disabled={!!selectedAnswer || status === "answered"}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left disabled:cursor-not-allowed ${bg} border-${border}`}
                        style={{ borderColor: isSelected ? (isCorrect === null ? "#F5A623" : isCorrect ? "#0D9373" : "#E84855") : "rgba(255,255,255,0.1)" }}
                      >
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white"
                          style={{ background: OPTION_COLORS[i] }}>
                          {LETTERS[i]}
                        </span>
                        <span className="text-sm font-medium flex-1">{opt}</span>
                        {isSelected && isCorrect !== null && (
                          isCorrect
                            ? <CheckCircle2 size={16} className="text-[#0D9373] shrink-0" />
                            : <XCircle size={16} className="text-[#E84855] shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Feedback after answering */}
              {status === "answered" && isCorrect !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-xl border text-center ${isCorrect ? "border-[#0D9373]/30 bg-[#0D9373]/10" : "border-[#E84855]/30 bg-[#E84855]/10"}`}
                >
                  <div className="text-3xl mb-1">{isCorrect ? "✅" : "❌"}</div>
                  <p className="font-bold">{isCorrect ? "To'g'ri!" : "Noto'g'ri"}</p>
                  {lastPoints > 0 && (
                    <p className="text-sm text-slate-300 mt-1">
                      <Zap size={12} className="inline text-[#F5A623]" /> +{lastPoints} ball
                      {streak > 1 && <span className="ml-2">🔥 {streak} ketma-ket</span>}
                    </p>
                  )}
                </motion.div>
              )}

              {status === "answered" && isCorrect === null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-slate-400 text-sm">Natijalar kutilmoqda...</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RESULTS */}
          {status === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
                <h3 className="font-bold text-[#F5A623] mb-2">✅ To&apos;g&apos;ri javob</h3>
                <p className="font-bold text-lg">{correctAnswer}</p>
                {explanation && <p className="text-sm text-slate-400 mt-2">{explanation}</p>}
              </div>
              {leaderboard.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy size={16} className="text-amber-400" /> Top 5</h3>
                  <div className="space-y-2">
                    {leaderboard.map((p) => (
                      <div key={p.rank} className={`flex items-center gap-3 p-2 rounded-xl ${p.name === nickname ? "bg-[#F5A623]/10 border border-[#F5A623]/30" : ""}`}>
                        <span className="w-7 text-center text-sm font-bold">
                          {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : p.rank}
                        </span>
                        <span className="flex-1 text-sm font-medium">{p.name}</span>
                        <span className="font-mono font-bold text-sm text-[#F5A623]">{p.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-center text-slate-500 text-sm mt-4 animate-pulse">Keyingi savol kutilmoqda...</p>
            </motion.div>
          )}

          {/* ENDED */}
          {status === "ended" && (
            <motion.div key="ended" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-1">Test tugadi!</h2>
              <p className="text-slate-400 mb-2">Yakuniy natijangiz:</p>
              <p className="text-4xl font-bold text-[#F5A623] mb-6">{myScore} <span className="text-lg text-slate-400">ball</span></p>

              {leaderboard.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left">
                  <h3 className="font-bold mb-4 text-center flex items-center justify-center gap-2">
                    <Crown size={18} className="text-amber-400" /> Reyting
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((p, idx) => (
                      <motion.div
                        key={p.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`flex items-center gap-3 p-3 rounded-xl ${p.name === nickname ? "bg-[#F5A623]/10 border border-[#F5A623]/30" : "bg-white/5"}`}
                      >
                        <span className="text-xl w-8 text-center">
                          {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                        </span>
                        <span className="flex-1 font-medium">{p.name}</span>
                        <span className="font-mono font-bold text-[#F5A623]">{p.score}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push("/student/dashboard")}
                className="px-8 py-4 bg-[#F5A623] text-black rounded-2xl font-bold text-lg hover:bg-[#f7b955] transition"
              >
                Dashboard ga qaytish
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
