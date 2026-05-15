"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export function SessionQRWidget({ roomCode, role }: { 
  roomCode: string; 
  role: "professor" | "student";
}) {
  const [minimized, setMinimized] = useState(false);
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join/${roomCode}`;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-gray-900 border border-white/10 rounded-2xl shadow-2xl 
                      transition-all duration-300 overflow-hidden ${
                        minimized ? "w-12 h-12" : "w-48"
                      }`}>
        {minimized ? (
          <button
            onClick={() => setMinimized(false)}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white font-bold text-xs"
          >
            QR
          </button>
        ) : (
          <div className="p-3">
            <div className="bg-white rounded-xl p-2 flex justify-center">
              <QRCode value={joinUrl} size={120} />
            </div>
            <p className="text-center text-sm font-mono font-bold text-white mt-3">
              {roomCode}
            </p>
            <p className="text-center text-xs text-gray-500 mt-1">
              {role === "professor" ? "O&apos;quvchilar shu kodni kiriting" : "Do&apos;stingizga ulashing"}
            </p>
            <button
              onClick={() => setMinimized(true)}
              className="w-full mt-3 py-1 bg-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition"
            >
              Kichraytirish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
