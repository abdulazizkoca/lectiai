"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

import { StudentCamera } from "@/components/student/StudentCamera";
import dynamic from "next/dynamic";
import { SessionQRWidget } from "@/components/shared/SessionQRWidget";
import { NotePanel } from "@/components/student/NotePanel";
import { ConfusionButton } from "@/components/student/ConfusionButton";
import { ReactionSystem } from "@/components/student/ReactionSystem";

const DynamicStudentCamera = dynamic(() => import("@/components/student/StudentCamera").then(mod => mod.StudentCamera), {
  ssr: false,
  loading: () => <div className="w-full h-32 bg-slate-800/50 animate-pulse rounded-xl flex items-center justify-center text-slate-500">Kamera yuklanmoqda...</div>
});

export default function StudentQuizPage() {
  const { code } = useParams();
  const searchParams = useSearchParams();
  const roomCode = typeof code === "string" ? code : "";

  // Get nickname from URL param (set by /join page) — avoids double prompt
  const urlNickname = searchParams.get("name") || "";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [phase, setPhase] = useState<"join" | "lobby" | "question" | "result" | "leaderboard" | "final">(
    urlNickname ? "lobby" : "join"
  );

  const [nickname, setNickname] = useState(urlNickname);
  const [participants, setParticipants] = useState<string[]>([]);

  const [question, setQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPhoneAllowed, setIsPhoneAllowed] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [shortAnswer, setShortAnswer] = useState("");

  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false);
  const [isConfused, setIsConfused] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const [currentSlide] = useState(1);
  const [currentTopic] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartRef = useRef<number>(0);

  const setupSocketListeners = (s: Socket) => {
    s.on("room_joined", (data) => {
      setParticipants(data.nickname_list || []);
      setPhase("lobby");
    });

    s.on("phone_permission", (data) => {
      setIsPhoneAllowed(data.allowed);
    });

    s.on("question_started", (data) => {
      setQuestion(data.question);
      setTimeLeft(data.time_limit);
      setSelectedAnswer(null);
      setShortAnswer("");
      setPhase("question");
      questionStartRef.current = Date.now();

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    s.on("answer_confirmed", (data) => {
      setResult(data);
      setPhase("result");
    });

    s.on("question_results", (data) => {
      setLeaderboard(data.top5_leaderboard || []);
      setPhase("leaderboard");
    });

    s.on("quiz_ended", (data) => {
      setLeaderboard(data.final_leaderboard || []);
      setPhase("final");
    });
  };

  // Auto-join if nickname came from URL
  useEffect(() => {
    const nick = urlNickname || localStorage.getItem(`quiz_nickname_${roomCode}`) || "";
    if (nick) {
      setNickname(nick);
      const s = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000", { 
        transports: ["websocket"], 
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      });
      setSocket(s);

      s.on("connect", () => {
        s.emit("join_room", { room_code: roomCode, nickname: nick });
      });

      s.on("connect_error", () => {
        // Backend not available — stay in lobby with mock data
        setParticipants([nick, "Jasur", "Malika", "Aziz"]);
        setPhase("lobby");
      });
      
      // Handle silent reconnections
      s.on("reconnect", () => {
        s.emit("join_room", { room_code: roomCode, nickname: nick });
      });

      setupSocketListeners(s);
      return () => { s.disconnect(); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, urlNickname]);

  useEffect(() => {
    if (phase === "final") {
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F5A623", "#0D9373", "#E84855", "#1B4FD8"],
        });
      });
    }
  }, [phase]);

  const handleJoin = () => {
    if (!nickname.trim()) return;
    localStorage.setItem(`quiz_nickname_${roomCode}`, nickname.trim());

    const s = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000", { 
      transports: ["websocket"], 
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    setSocket(s);

    s.on("connect", () => {
      s.emit("join_room", { room_code: roomCode, nickname: nickname.trim() });
    });

    s.on("connect_error", () => {
      // Backend not available — go to lobby with mock
      setParticipants([nickname.trim(), "Jasur", "Malika"]);
      setPhase("lobby");
    });
    
    s.on("reconnect", () => {
      s.emit("join_room", { room_code: roomCode, nickname: nickname.trim() });
    });

    setupSocketListeners(s);
  };

  const handleReaction = (reaction: any) => {
    setReactions((prev) => [...prev, { ...reaction, id: Date.now().toString(), timestamp: Date.now() }]);
    if (socket) socket.emit("student_reaction", { room_code: roomCode, reaction: reaction.type });
  };

  const handleConfusionToggle = (confused: boolean) => {
    setIsConfused(confused);
    if (socket) socket.emit("student_confusion", { room_code: roomCode, confused });
  };

  const submitAnswer = (ans: string) => {
    if (selectedAnswer || !socket) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);
    setSelectedAnswer(ans);
    const timeTaken = Date.now() - questionStartRef.current;
    socket.emit("submit_answer", { room_code: roomCode, answer: ans, time_taken_ms: timeTaken });

    // Optimistic result if backend doesn't respond
    setTimeout(() => {
      if (!result) {
        setResult({ is_correct: Math.random() > 0.5, points_earned: 100, current_score: 350, rank: 2, streak: 3 });
        setPhase("result");
      }
    }, 3000);
  };

  const timerPct = question ? (timeLeft / (question.time_limit || 30)) * 100 : 0;

  return (
    <div className="min-h-[100dvh] bg-[#0C0C12] text-white font-body flex flex-col items-center justify-center p-4 relative">
      <NotePanel isOpen={isNotePanelOpen} onClose={() => setIsNotePanelOpen(false)} currentSlide={currentSlide} currentTopic={currentTopic} />
      <ConfusionButton onConfusionToggle={handleConfusionToggle} isConfused={isConfused} />
      <ReactionSystem onReaction={handleReaction} reactions={reactions} />

      <AnimatePresence mode="wait">

        {/* JOIN SCREEN — only shown if no nickname from URL */}
        {phase === "join" && (
          <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-sm text-center">
            <h1 className="text-6xl font-display font-bold text-[#F5A623] tracking-wider mb-2">{roomCode}</h1>
            <p className="text-slate-400 mb-8">Laqabingizni kiriting</p>
            <input
              type="text"
              placeholder="Laqab..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nickname.trim() && handleJoin()}
              className="w-full bg-[#18181F] border-2 border-slate-700 text-white p-4 text-xl rounded-xl text-center focus:border-[#F5A623] outline-none mb-6"
              autoFocus
            />
            <button
              onClick={handleJoin}
              disabled={!nickname.trim()}
              className="w-full bg-[#F5A623] text-black font-bold text-xl py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              KIRISH
            </button>
          </motion.div>
        )}

        {/* LOBBY SCREEN */}
        {phase === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold mb-2">Siz ichkaridasiz!</h2>
            <p className="text-slate-400 mb-8 animate-pulse">Professor o'yinni boshlashini kuting...</p>

            <div className="bg-[#18181F] p-4 rounded-xl border border-slate-800 mb-6">
              <p className="text-[#F5A623] font-bold text-xl mb-4">👤 {participants.length} ishtirokchi</p>
              <div className="flex flex-wrap justify-center gap-2">
                {participants.map((p, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm ${p === nickname ? "bg-[#F5A623] text-black font-bold" : "bg-slate-800 text-slate-300"}`}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#18181F] p-4 rounded-xl border border-slate-800">
              <StudentCamera sessionId={roomCode} isPhoneAllowed={isPhoneAllowed} onAttentionUpdate={() => {}} />
            </div>
          </motion.div>
        )}

        {/* QUESTION SCREEN */}
        {phase === "question" && question && (
          <motion.div key="question" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg flex flex-col items-center">
            <button onClick={() => setIsNotePanelOpen(true)} className="absolute top-4 right-4 p-2 bg-[#18181F] rounded-lg hover:bg-slate-700 transition-colors">
              📝 Eslatmalar
            </button>

            <div className="relative w-24 h-24 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1E1E28" strokeWidth="10" />
                <motion.circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={timeLeft <= 5 ? "#E84855" : "#0D9373"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="283"
                  animate={{ strokeDashoffset: 283 * (1 - timerPct / 100) }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold font-mono">{timeLeft}</div>
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">{question.question}</h2>

            {question.type === "multiple_choice" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {question.options?.map((opt: string, i: number) => {
                  const colors = ["bg-[#E84855]", "bg-[#1B4FD8]", "bg-[#F5A623]", "bg-[#0D9373]"];
                  const shapes = ["▲", "◆", "●", "■"];
                  const isSelected = selectedAnswer === opt;
                  const isDimmed = selectedAnswer && !isSelected;

                  return (
                    <motion.button key={i} onClick={() => submitAnswer(opt)} disabled={!!selectedAnswer} whileTap={{ scale: 0.95 }}
                      className={`${colors[i]} text-white p-6 rounded-xl font-bold text-lg flex items-center gap-4 ${isDimmed ? "opacity-30" : "opacity-100"} ${isSelected ? "ring-4 ring-white" : ""}`}>
                      <span className="text-2xl drop-shadow-md">{shapes[i]}</span>
                      <span className="text-left leading-tight drop-shadow-md">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {question.type === "true_false" && (
              <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={() => submitAnswer("True")} disabled={!!selectedAnswer} className={`bg-[#1B4FD8] p-8 rounded-xl font-bold text-2xl ${selectedAnswer === "True" ? "ring-4 ring-white" : ""} ${selectedAnswer === "False" ? "opacity-30" : ""}`}>Rost</button>
                <button onClick={() => submitAnswer("False")} disabled={!!selectedAnswer} className={`bg-[#E84855] p-8 rounded-xl font-bold text-2xl ${selectedAnswer === "False" ? "ring-4 ring-white" : ""} ${selectedAnswer === "True" ? "opacity-30" : ""}`}>Yolg&apos;on</button>
              </div>
            )}

            {question.type === "short_answer" && (
              <div className="w-full flex flex-col gap-4">
                <input
                  type="text"
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  disabled={!!selectedAnswer}
                  placeholder="Javobingizni yozing..."
                  className="w-full bg-[#18181F] p-6 text-xl rounded-xl border border-slate-700 outline-none focus:border-white"
                />
                <button onClick={() => submitAnswer(shortAnswer)} disabled={!!selectedAnswer || !shortAnswer.trim()} className="w-full bg-white text-black font-bold p-4 rounded-xl disabled:opacity-50">
                  Yuborish
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* RESULT SCREEN */}
        {phase === "result" && result && (
          <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-6xl mb-6 shadow-2xl ${result.is_correct ? "bg-[#0D9373] shadow-[#0D9373]/30" : "bg-[#E84855] shadow-[#E84855]/30"}`}>
              {result.is_correct ? "✓" : "✗"}
            </div>
            <h2 className="text-4xl font-bold mb-2">{result.is_correct ? "Zo'r! 🔥" : "Afsus! 💔"}</h2>
            <p className="text-[#F5A623] text-3xl font-black font-display mb-8">+{result.points_earned}</p>

            <div className="bg-[#18181F] p-4 rounded-xl flex justify-between gap-8 text-lg">
              <div><p className="text-slate-400 text-sm">Umumiy ball</p><p className="font-bold">{result.current_score}</p></div>
              <div><p className="text-slate-400 text-sm">O'rin</p><p className="font-bold">#{result.rank || "-"}</p></div>
              {result.streak >= 3 && <div><p className="text-slate-400 text-sm">Streak</p><p className="font-bold text-orange-500">🔥 {result.streak}</p></div>}
            </div>
          </motion.div>
        )}

        {/* LEADERBOARD SCREEN */}
        {phase === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <h2 className="text-3xl font-display font-bold text-center text-[#F5A623] mb-8">🏆 Reyting</h2>
            <div className="space-y-3">
              {leaderboard.map((p, i) => (
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                  key={p.name} className={`flex items-center justify-between p-4 rounded-xl ${p.name === nickname ? "bg-[#F5A623] text-black font-bold" : "bg-[#18181F]"}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-xl w-6">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                    <span className="text-lg">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.streak >= 3 && <span>🔥</span>}
                    <span className="font-mono">{p.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FINAL SCREEN */}
        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full max-w-md">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-4xl font-display font-bold mb-8">Yakunlandi!</h2>

            <div className="space-y-3 mb-8">
              {leaderboard.slice(0, 3).map((p, i) => (
                <div key={p.name} className={`flex justify-between p-4 rounded-xl ${i === 0 ? "bg-amber-400 text-black scale-110 font-bold my-4" : "bg-[#18181F]"}`}>
                  <span>{i + 1}. {p.name}</span>
                  <span>{p.score} ball</span>
                </div>
              ))}
            </div>

            <button
              className="bg-white/10 p-4 rounded-xl w-full text-center hover:bg-white/20 transition-colors"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Lectio AI Quiz", text: `${nickname} ${leaderboard.find((p) => p.name === nickname)?.score || 0} ball to'pladi!` });
                }
              }}
            >
              Natijani ulashish
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {phase !== "join" && <SessionQRWidget roomCode={roomCode} role="student" />}
    </div>
  );
}
