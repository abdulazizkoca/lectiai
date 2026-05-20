"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Activity, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/contexts/ToastContext";

interface StudentAttention {
  student_id: string;
  nickname: string;
  attention: number;
  boredom: boolean;
  confusion: boolean;
  lastUpdated: number;
}

interface TeacherDashboardProps {
  roomCode?: string;
}

export default function TeacherDashboard({ roomCode = "TEST01" }: TeacherDashboardProps) {
  const [students, setStudents] = useState<Record<string, StudentAttention>>({});
  const socketRef = useRef<Socket | null>(null);
  const { info } = useToast();

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Teacher dashboard connected");
      // Simulate professor room creation/joining
      socketRef.current?.emit("create_room", { lesson_id: 1, questions: [] });
    });

    socketRef.current.on("room_created", (data: { room_code: string }) => {
      info("Xona yaratildi", `Xona kodi: ${data.room_code}`);
    });

    socketRef.current.on("student_attention", (data: any) => {
      setStudents((prev) => ({
        ...prev,
        [data.student_id]: {
          ...data,
          lastUpdated: Date.now(),
        },
      }));
    });

    // Cleanup stale students
    const interval = setInterval(() => {
      const now = Date.now();
      setStudents((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [id, student] of Object.entries(next)) {
          if (now - student.lastUpdated > 5000) { // 5 seconds without update
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, []);

  const studentList = Object.values(students);
  const avgAttention = studentList.length 
    ? studentList.reduce((acc, s) => acc + s.attention, 0) / studentList.length 
    : 0;

  const getAttentionColor = (score: number) => {
    if (score >= 70) return "text-green-400 bg-green-400/10 border-green-400/30";
    if (score >= 40) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    return "text-red-400 bg-red-400/10 border-red-400/30";
  };

  const getAttentionStatus = (score: number) => {
    if (score >= 70) return "Diqqatli";
    if (score >= 40) return "Chalg'igan";
    return "E'tiborsiz";
  };

  return (
    <div className="w-full min-h-[500px] p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" /> O'quvchilar Diqqati
          </h2>
          <p className="text-slate-400">Real vaqt monitoringi (Xona: {roomCode})</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
          <div className="text-center px-4 border-r border-slate-700">
            <p className="text-xs text-slate-400 mb-1">O'quvchilar</p>
            <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
              <Users size={18} className="text-blue-400" /> {studentList.length}
            </p>
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-slate-400 mb-1">O'rtacha diqqat</p>
            <p className={`text-xl font-bold ${getAttentionColor(avgAttention).split(" ")[0]}`}>
              {Math.round(avgAttention)}%
            </p>
          </div>
        </div>
      </div>

      {studentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <EyeOff size={32} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">O'quvchilar yo'q</h3>
          <p className="text-slate-500 max-w-sm">
            Hozircha hech qaysi o'quvchi xonaga kirmagan yoki kamerasini yoqmagan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {studentList.map((student) => {
              const colorClass = getAttentionColor(student.attention);
              return (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative overflow-hidden rounded-2xl p-5 border ${colorClass} transition-colors duration-500`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700 shadow-inner">
                        {student.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white leading-tight">{student.nickname}</h4>
                        <p className="text-xs opacity-80">{getAttentionStatus(student.attention)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono">{Math.round(student.attention)}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      className={`h-full ${student.attention >= 70 ? 'bg-green-500' : student.attention >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${student.attention}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Status indicators */}
                  <div className="flex gap-2">
                    {student.boredom && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded-md">
                        <AlertTriangle size={10} /> Zerikkan
                      </span>
                    )}
                    {student.confusion && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md">
                        <AlertTriangle size={10} /> Tushunmagan
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
