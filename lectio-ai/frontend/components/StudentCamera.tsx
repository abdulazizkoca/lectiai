"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, UserCircle, Play, XCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/contexts/ToastContext";

interface StudentCameraProps {
  roomCode?: string;
}

export default function StudentCamera({ roomCode = "TEST01" }: StudentCameraProps) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { success, error, info } = useToast();

  // Socket connection
  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000", {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current.on("connect", () => {
      console.log("WebSocket connected");
      if (isRegistered) {
        // Join room if already registered
        socketRef.current?.emit("join_room", {
          room_code: roomCode,
          nickname: `${name} ${surname}`,
          student_id: `stu_${Date.now()}`,
        });
      }
    });

    return () => {
      stopCamera();
      socketRef.current?.disconnect();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (err) {
      error("Kamera xatosi", "Kamerani yoqib bo'lmadi. Ruxsatlarni tekshiring.");
      return false;
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to low quality JPEG to save bandwidth
    const frameData = canvas.toDataURL("image/jpeg", 0.5);
    
    socketRef.current.emit("camera_frame", {
      room_code: roomCode,
      frame: frameData,
      student_id: `stu_${name.toLowerCase()}`,
      nickname: `${name} ${surname}`,
    });
  };

  const handleRegister = async () => {
    if (!name || !surname) {
      error("Xato", "Ism va familiyani kiriting");
      return;
    }

    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    // Simulate sending registration image to API
    setTimeout(() => {
      setIsRegistered(true);
      success("Muvaffaqiyatli", "Yuz ma'lumotlari saqlandi va tizimga kirdingiz.");
      
      socketRef.current?.emit("join_room", {
        room_code: roomCode,
        nickname: `${name} ${surname}`,
        student_id: `stu_${name.toLowerCase()}`,
      });

      // Start streaming frames
      setIsStreaming(true);
      intervalRef.current = setInterval(captureAndSendFrame, 1000); // 1 FPS
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      <div className="p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="text-blue-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Talaba Kamerasi</h2>
          <p className="text-slate-400">Yuzingizni ro'yxatdan o'tkazing va darsga qo'shiling</p>
        </div>

        {!isRegistered ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Ism</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Familiya</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Valiyev"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={!name || !surname}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserCircle size={20} />
              Yuzni tasdiqlash va kirish
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs font-medium text-white">
                  {isStreaming ? 'LIVE' : 'Kutilmoqda...'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {name[0]}{surname[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{name} {surname}</p>
                  <p className="text-xs text-slate-400">Xona: {roomCode}</p>
                </div>
              </div>
              
              {isStreaming ? (
                <button 
                  onClick={stopCamera}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="To'xtatish"
                >
                  <XCircle size={20} />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    startCamera();
                    setIsStreaming(true);
                    intervalRef.current = setInterval(captureAndSendFrame, 1000);
                  }}
                  className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                  title="Boshlash"
                >
                  <Play size={20} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
