"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Users, CheckCircle, BrainCircuit, Play, Square, FastForward, Pause } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfessorQuizControl() {
  const { code } = useParams();
  const roomCode = typeof code === "string" ? code : "";
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [status, setStatus] = useState<"waiting" | "active" | "results" | "ended">("waiting");
  
  const [question, setQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(10); // Should come from API
  
  const [answeredCount, setAnsweredCount] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [studentQuestions, setStudentQuestions] = useState<string[]>([]);
  
  useEffect(() => {
    // In production, professor auth token is needed to take control
    const s = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000", {
      transports: ["websocket"],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    setSocket(s);
    
    // Auto rejoin silently on reconnect
    s.on("reconnect", () => {
      // s.emit("professor_rejoin", { room_code: roomCode })
    });

    // In a real app, we would emit 'create_room' or 'rejoin_room' as professor here
    // For demo purposes, we just join as professor
    
    s.on("room_joined", (data) => {
      setParticipants(data.nickname_list);
    });
    
    s.on("participant_left", (data) => {
      setParticipants(prev => prev.filter(p => p !== data.name));
    });
    
    s.on("answer_count_update", (data) => {
      setAnsweredCount(data.answered);
    });
    
    s.on("student_asked", (data) => {
      setStudentQuestions(prev => [data.question_text, ...prev].slice(0, 5));
    });
    
    s.on("question_results", (data) => {
      setStatus("results");
      setStats(data.stats);
    });
    
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
  
  const endQuestion = () => {
    if (!socket) return;
    socket.emit("end_question", { room_code: roomCode });
  };
  
  const endQuiz = () => {
    if (!socket) return;
    if (window.confirm("Darsni haqiqatan ham yakunlamoqchimisiz?")) {
      setStatus("ended");
      socket.emit("end_quiz", { room_code: roomCode });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col font-body">
      
      {/* TOP BAR */}
      <header className="bg-[#18181F] border-b border-slate-800 p-4 px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-[#F5A623]/10 text-[#F5A623] px-4 py-2 rounded-lg border border-[#F5A623]/20">
            <span className="text-sm font-bold uppercase tracking-wider block leading-none mb-1">Xona kodi</span>
            <span className="text-2xl font-mono font-bold leading-none">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Users size={20} />
            <span className="text-xl font-bold">{participants.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Savol: {Math.max(0, questionIndex + 1)} / {totalQuestions}</span>
          {status === "waiting" && (
            <button onClick={nextQuestion} className="bg-[#F5A623] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <Play size={18} fill="currentColor" /> Boshlash
            </button>
          )}
          {status === "active" && (
            <button onClick={endQuestion} className="bg-[#E84855] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <Square size={18} fill="currentColor" /> Majburiy Yakunlash
            </button>
          )}
          {status === "results" && (
            <button onClick={nextQuestion} className="bg-[#1B4FD8] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <FastForward size={18} fill="currentColor" /> Keyingi savol
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: QUESTION PREVIEW */}
        <main className="flex-1 p-8 overflow-y-auto border-r border-slate-800 flex flex-col items-center justify-center relative">
          
          {status === "waiting" && (
            <div className="text-center">
              <h2 className="text-4xl font-display font-bold text-slate-300 mb-4">O'quvchilarni kuting...</h2>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mt-8">
                {participants.map(p => (
                  <span key={p} className="bg-slate-800 px-4 py-2 rounded-full text-sm font-bold">{p}</span>
                ))}
              </div>
            </div>
          )}
          
          {status === "active" && (
            <div className="w-full max-w-3xl text-center">
              <h2 className="text-4xl font-display font-bold mb-12 leading-tight">Savol ekrani (Talabalar ko'rmoqda)</h2>
              <div className="grid grid-cols-2 gap-6 opacity-50 pointer-events-none">
                <div className="bg-[#E84855] h-32 rounded-xl"></div>
                <div className="bg-[#1B4FD8] h-32 rounded-xl"></div>
                <div className="bg-[#F5A623] h-32 rounded-xl"></div>
                <div className="bg-[#0D9373] h-32 rounded-xl"></div>
              </div>
            </div>
          )}
          
          {status === "results" && (
            <div className="w-full max-w-3xl">
              <h2 className="text-3xl font-display font-bold mb-8">Natijalar</h2>
              <div className="bg-[#18181F] p-8 rounded-2xl border border-slate-800">
                <div className="flex items-start gap-6">
                  <div className="bg-emerald-500/20 p-4 rounded-xl text-emerald-500 shrink-0">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">To'g'ri javob</p>
                    <p className="text-2xl font-bold">Varianti (simulyatsiya)</p>
                  </div>
                </div>
                
                <hr className="border-slate-800 my-8" />
                
                <div className="flex items-start gap-4">
                  <BrainCircuit className="text-[#F5A623] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-[#F5A623] mb-2">AI Xulosasi</h4>
                    <p className="text-slate-300 leading-relaxed">
                      O'quvchilarning 45% xato variantni tanladi. Bu tushunchani qayta tushuntirishingiz tavsiya etiladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </main>
        
        {/* RIGHT: LIVE STATS */}
        <aside className="w-96 bg-[#0F0F14] p-6 overflow-y-auto flex flex-col gap-8">
          
          <div className="bg-[#18181F] rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Javob berganlar</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold font-mono">{answeredCount}</span>
              <span className="text-xl text-slate-500 mb-1">/ {participants.length}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#1B4FD8]"
                animate={{ width: `${participants.length ? (answeredCount / participants.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          
          {status === "results" && (
            <div className="bg-[#18181F] rounded-xl p-5 border border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Taqsimot</h3>
              <div className="space-y-3">
                {Object.entries(stats).map(([ans, count]: [string, any]) => (
                  <div key={ans}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ans}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(count / Math.max(1, answeredCount)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex-1 bg-[#18181F] rounded-xl p-5 border border-slate-800 flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between">
              O'quvchi savollari
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{studentQuestions.length}</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {studentQuestions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center mt-10">Hozircha savollar yo'q</p>
              ) : (
                studentQuestions.map((q, i) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="bg-slate-800 p-3 rounded-lg text-sm">
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
