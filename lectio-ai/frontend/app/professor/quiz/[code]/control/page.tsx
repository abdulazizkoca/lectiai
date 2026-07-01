"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Users, CheckCircle, BrainCircuit, Play, Square, FastForward } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfessorQuizControl() {
  const { code } = useParams();
  const roomCode = typeof code === "string" ? code : "";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [status, setStatus] = useState<"waiting" | "active" | "results" | "ended">("waiting");
  const [question, setQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions] = useState(10);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [studentQuestions, setStudentQuestions] = useState<string[]>([]);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000", {
      transports: ["websocket"],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
    setSocket(s);

    s.on("room_joined",       (data) => setParticipants(data.nickname_list));
    s.on("participant_left",  (data) => setParticipants(prev => prev.filter(p => p !== data.name)));
    s.on("answer_count_update", (data) => setAnsweredCount(data.answered));
    s.on("student_asked",     (data) => setStudentQuestions(prev => [data.question_text, ...prev].slice(0, 5)));
    s.on("question_results",  (data) => { setStatus("results"); setStats(data.stats); });

    return () => { s.disconnect(); };
  }, []);

  const nextQuestion = () => {
    if (!socket) return;
    const nextIdx = questionIndex + 1;
    setQuestionIndex(nextIdx);
    setAnsweredCount(0);
    setStats({});
    setStatus("active");
    socket.emit("start_question", { room_code: roomCode, question_index: nextIdx });
  };

  const endQuestion = () => { if (socket) socket.emit("end_question", { room_code: roomCode }); };

  const endQuiz = () => {
    if (!socket) return;
    if (window.confirm("Darsni haqiqatan ham yakunlamoqchimisiz?")) {
      setStatus("ended");
      socket.emit("end_quiz", { room_code: roomCode });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-body"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* TOP BAR */}
      <header
        className="border-b border-white/10 p-4 px-6 flex justify-between items-center shrink-0"
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-center gap-6">
          <div className="bg-saffron/10 text-saffron px-4 py-2 rounded-lg border border-saffron/20">
            <span className="text-sm font-bold uppercase tracking-wider block leading-none mb-1">Xona kodi</span>
            <span className="text-2xl font-mono font-bold leading-none">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <Users size={20} />
            <span className="text-xl font-bold">{participants.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span style={{ color: "var(--muted-foreground)" }}>
            Savol: {Math.max(0, questionIndex + 1)} / {totalQuestions}
          </span>
          {status === "waiting" && (
            <button
              onClick={nextQuestion}
              className="bg-saffron text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Play size={18} fill="currentColor" /> Boshlash
            </button>
          )}
          {status === "active" && (
            <button
              onClick={endQuestion}
              className="bg-coral text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Square size={18} fill="currentColor" /> Majburiy Yakunlash
            </button>
          )}
          {status === "results" && (
            <button
              onClick={nextQuestion}
              className="bg-lapis text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <FastForward size={18} fill="currentColor" /> Keyingi savol
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: QUESTION PREVIEW */}
        <main className="flex-1 p-8 overflow-y-auto border-r border-white/10 flex flex-col items-center justify-center relative">

          {status === "waiting" && (
            <div className="text-center">
              <h2
                className="text-4xl font-display font-bold mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                O&apos;quvchilarni kuting...
              </h2>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mt-8">
                {participants.map(p => (
                  <span
                    key={p}
                    className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {status === "active" && (
            <div className="w-full max-w-3xl text-center">
              <h2 className="text-4xl font-display font-bold mb-12 leading-tight">
                Savol ekrani (Talabalar ko&apos;rmoqda)
              </h2>
              <div className="grid grid-cols-2 gap-6 opacity-50 pointer-events-none">
                <div className="bg-coral h-32 rounded-xl" />
                <div className="bg-lapis h-32 rounded-xl" />
                <div className="bg-saffron h-32 rounded-xl" />
                <div className="bg-jade h-32 rounded-xl" />
              </div>
            </div>
          )}

          {status === "results" && (
            <div className="w-full max-w-3xl">
              <h2 className="text-3xl font-display font-bold mb-8">Natijalar</h2>
              <div
                className="p-8 rounded-2xl border border-white/10"
                style={{ background: "var(--card)" }}
              >
                <div className="flex items-start gap-6">
                  <div className="bg-jade/20 p-4 rounded-xl text-jade shrink-0">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold uppercase tracking-wider mb-2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      To&apos;g&apos;ri javob
                    </p>
                    <p className="text-2xl font-bold">Varianti (simulyatsiya)</p>
                  </div>
                </div>

                <hr className="border-white/10 my-8" />

                <div className="flex items-start gap-4">
                  <BrainCircuit className="text-saffron shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-saffron mb-2">AI Xulosasi</h4>
                    <p style={{ color: "var(--muted-foreground)" }} className="leading-relaxed">
                      O&apos;quvchilarning 45% xato variantni tanladi. Bu tushunchani qayta tushuntirishingiz tavsiya etiladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT: LIVE STATS */}
        <aside
          className="w-96 p-6 overflow-y-auto flex flex-col gap-8 border-l border-white/5"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          {/* Answered count */}
          <div
            className="rounded-xl p-5 border border-white/10"
            style={{ background: "var(--card)" }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Javob berganlar
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold font-mono">{answeredCount}</span>
              <span className="text-xl mb-1" style={{ color: "var(--muted-foreground)" }}>
                / {participants.length}
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                className="h-full bg-lapis"
                animate={{ width: `${participants.length ? (answeredCount / participants.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Answer distribution */}
          {status === "results" && (
            <div
              className="rounded-xl p-5 border border-white/10"
              style={{ background: "var(--card)" }}
            >
              <h3
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                Taqsimot
              </h3>
              <div className="space-y-3">
                {Object.entries(stats).map(([ans, count]: [string, any]) => (
                  <div key={ans}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ans}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-saffron to-jade"
                        style={{ width: `${(count / Math.max(1, answeredCount)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student questions */}
          <div
            className="flex-1 rounded-xl p-5 border border-white/10 flex flex-col"
            style={{ background: "var(--card)" }}
          >
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-4 flex justify-between"
              style={{ color: "var(--muted-foreground)" }}
            >
              O&apos;quvchi savollari
              <span className="bg-coral text-white text-xs px-2 py-0.5 rounded-full">
                {studentQuestions.length}
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3">
              {studentQuestions.length === 0 ? (
                <p
                  className="text-sm text-center mt-10"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Hozircha savollar yo&apos;q
                </p>
              ) : (
                studentQuestions.map((q, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {q}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
