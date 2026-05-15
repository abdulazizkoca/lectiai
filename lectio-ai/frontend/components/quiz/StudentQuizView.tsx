"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

type Phase = "joining" | "waiting" | "question" | "answered" | "results" | "leaderboard" | "ended";

const OPTION_CONFIG = {
  A: { color: "#E84855", shape: "▲", label: "A" },
  B: { color: "#1B4FD8", shape: "◆", label: "B" },
  C: { color: "#F5A623", shape: "●", label: "C" },
  D: { color: "#0D9373", shape: "■", label: "D" },
};

interface QuestionData {
  time_limit: number;
  question_number: number;
  total_questions: number;
  question: string;
  options: string[];
}

interface AnswerResult {
  is_correct: boolean;
  points_earned: number;
  current_score: number;
  streak: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  streak?: number;
}

interface LeaderboardPayload {
  leaderboard: LeaderboardEntry[];
}

interface FinalLeaderboardPayload {
  final_leaderboard: LeaderboardEntry[];
}

export function StudentQuizView({ roomCode }: { roomCode: string }) {
  const [phase, setPhase] = useState<Phase>("joining");
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [myStreak, setMyStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000");
    socketRef.current = socket;

    socket.on("question_started", (data: QuestionData) => {
      setQuestion(data);
      setSelected(null);
      setTimeLeft(data.time_limit);
      setPhase("question");
      stopTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) {
            stopTimer();
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    });

    socket.on("answer_received", (data: AnswerResult) => {
      stopTimer();
      setLastResult(data);
      setMyScore(data.current_score);
      setMyStreak(data.streak);
      setPhase("answered");
    });

    socket.on("question_ended", (data: LeaderboardPayload) => {
      setLeaderboard(data.leaderboard);
      setPhase("leaderboard");
    });

    socket.on("quiz_ended", (data: FinalLeaderboardPayload) => {
      setLeaderboard(data.final_leaderboard);
      setPhase("ended");
    });

    return () => {
      socket.disconnect();
      stopTimer();
    };
  }, []);

  const joinRoom = () => {
    if (!nickname.trim()) return;
    socketRef.current?.emit("join_room", { room_code: roomCode, nickname });
    setPhase("waiting");
  };

  const submitAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    socketRef.current?.emit("submit_answer", { room_code: roomCode, answer });
  };

  const timerPct = question ? (timeLeft / question.time_limit) * 100 : 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0C0C12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <AnimatePresence mode="wait">

        {/* JOINING */}
        {phase === "joining" && (
          <motion.div key="join"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", maxWidth: 380, width: "100%" }}>
            <motion.h1 style={{ fontSize: "clamp(2.5rem,10vw,4.5rem)", color: "#F5A623",
              fontFamily: "'Playfair Display', serif", letterSpacing: "0.05em" }}>
              {roomCode}
            </motion.h1>
            <p style={{ color: "#8B8578", marginBottom: 20 }}>Laqabingizni kiriting</p>
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === "Enter" && joinRoom()}
              placeholder="Jasur, Dilnoza..."
              style={{
                width: "100%", padding: "16px 20px", fontSize: "1.1rem",
                background: "#18181F", color: "#F0EDE6",
                border: "2px solid rgba(245,166,35,0.3)", borderRadius: 12,
                outline: "none", marginBottom: 12,
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
            <motion.button onClick={joinRoom}
              whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
              style={{
                width: "100%", padding: "16px",
                background: "#F5A623", color: "#000",
                fontWeight: 700, fontSize: "1.1rem",
                border: "none", borderRadius: 12, cursor: "pointer"
              }}>
              Kirish →
            </motion.button>
          </motion.div>
        )}

        {/* WAITING */}
        {phase === "waiting" && (
          <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center" }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(245,166,35,0.2)",
                border: "3px solid #F5A623",
                margin: "0 auto 20px"
              }}
            />
            <h2 style={{ color: "#F0EDE6", fontSize: "1.5rem" }}>Salom, {nickname}!</h2>
            <p style={{ color: "#8B8578" }}>Test boshlanishini kuting...</p>
            <div style={{
              marginTop: 20, padding: "8px 20px",
              background: "rgba(27,79,216,0.2)",
              borderRadius: 999, display: "inline-block",
              color: "#1B4FD8", fontWeight: 700
            }}>
              {myScore} ball
            </div>
          </motion.div>
        )}

        {/* QUESTION */}
        {phase === "question" && question && (
          <motion.div key={`q${question.question_number}`}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>

            {/* Timer */}
            <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 16px" }}>
              <svg viewBox="0 0 100 100" width="88" height="88">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1E1E28" strokeWidth="8"/>
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={timeLeft <= 5 ? "#E84855" : timeLeft <= 10 ? "#F5A623" : "#0D9373"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerPct / 100)}
                  style={{ transformOrigin: "center", rotate: "-90deg" }}
                  animate={{ strokeDashoffset: circumference * (1 - timerPct / 100) }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 700, color: "#F0EDE6",
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {timeLeft}
              </div>
            </div>

            <p style={{ color: "#6B6578", fontSize: "0.85rem", marginBottom: 8 }}>
              {question.question_number} / {question.total_questions}
            </p>

            <motion.h2 style={{
              fontSize: "clamp(1.1rem,3vw,1.6rem)",
              color: "#F0EDE6",
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.4,
              marginBottom: 28
            }}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              {question.question}
            </motion.h2>

            {/* Options */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(question.options || []).map((opt: string, i: number) => {
                const key = opt[0] as keyof typeof OPTION_CONFIG;
                const cfg = OPTION_CONFIG[key] || OPTION_CONFIG.A;
                const isSelected = selected === key;
                const isDimmed = selected && !isSelected;

                return (
                  <motion.button key={key}
                    onClick={() => submitAnswer(key)}
                    disabled={!!selected}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isDimmed ? 0.35 : 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      padding: "16px 12px",
                      background: cfg.color,
                      color: "#fff",
                      border: isSelected ? "3px solid #fff" : "3px solid transparent",
                      borderRadius: 12,
                      cursor: selected ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      textAlign: "left", fontWeight: 600,
                      fontSize: "0.9rem"
                    }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{cfg.shape}</span>
                    <span>{opt.slice(3)}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ANSWERED */}
        {phase === "answered" && lastResult && (
          <motion.div key="answered"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ textAlign: "center" }}>

            <motion.div
              animate={{ rotate: lastResult.is_correct ? [0, -8, 8, 0] : [0, -4, 4, 0] }}
              transition={{ duration: 0.5 }}
              style={{
                width: 100, height: 100, borderRadius: "50%",
                background: lastResult.is_correct ? "#0D9373" : "#E84855",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.5rem", margin: "0 auto 20px"
              }}>
              {lastResult.is_correct ? "✓" : "✗"}
            </motion.div>

            <h2 style={{ color: "#F0EDE6", fontSize: "1.8rem", marginBottom: 8 }}>
              {lastResult.is_correct ? "To'g'ri!" : "Noto'g'ri!"}
            </h2>

            {lastResult.is_correct && (
              <motion.p
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                style={{ fontSize: "2.5rem", fontWeight: 900, color: "#F5A623",
                  fontFamily: "'Playfair Display', serif" }}>
                +{lastResult.points_earned}
              </motion.p>
            )}

            {myStreak >= 3 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ color: "#F5A623", fontSize: "1rem", marginTop: 8 }}>
                🔥 {myStreak} ketma-ket to&apos;g&apos;ri!
              </motion.div>
            )}

            <p style={{ color: "#8B8578", marginTop: 12 }}>
              Jami: <strong style={{ color: "#F0EDE6" }}>{myScore}</strong> ball
            </p>
            <p style={{ color: "#6B6578", fontSize: "0.85rem", marginTop: 8 }}>
              Keyingi savol kutilmoqda...
            </p>
          </motion.div>
        )}

        {/* LEADERBOARD */}
        {phase === "leaderboard" && (
          <motion.div key="lb"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: "100%", maxWidth: 400 }}>
            <h2 style={{ textAlign: "center", color: "#F5A623",
              fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>
              🏆 Reyting
            </h2>
            {leaderboard.map((p: LeaderboardEntry, i: number) => (
              <motion.div key={p.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 10, marginBottom: 8,
                  background: p.name === nickname ? "#F5A623" : "#18181F",
                  color: p.name === nickname ? "#000" : "#F0EDE6"
                }}>
                <span style={{ fontSize: "1.2rem" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                {(p.streak ?? 0) >= 3 && <span>🔥</span>}
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{p.score}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ENDED */}
        {phase === "ended" && (
          <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
            <motion.h1
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              style={{ fontSize: "2.5rem", marginBottom: 8 }}>
              🎉
            </motion.h1>
            <h2 style={{ color: "#F0EDE6", fontFamily: "'Playfair Display', serif", marginBottom: 20 }}>
              Test yakunlandi!
            </h2>
            {leaderboard.slice(0,5).map((p: LeaderboardEntry, i: number) => (
              <div key={p.name} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 8, marginBottom: 6,
                background: p.name === nickname ? "rgba(245,166,35,0.2)" : "#18181F",
                color: "#F0EDE6", border: p.name === nickname ? "1px solid #F5A623" : "none"
              }}>
                <span>{i+1}. {p.name}</span>
                <span style={{ fontWeight: 700 }}>{p.score} ball</span>
              </div>
            ))}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
