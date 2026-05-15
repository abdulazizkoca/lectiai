"use client";
import QRCode from "react-qr-code";

export function SessionQR({ roomCode }: { roomCode: string }) {
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join/${roomCode}`;
  
  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-2xl p-4 shadow-2xl z-50">
      <QRCode value={joinUrl} size={140} />
      <p className="text-center text-sm font-mono font-bold mt-2 text-gray-800">
        {roomCode}
      </p>
      <p className="text-center text-xs text-gray-500">Kirish uchun skanlang</p>
    </div>
  );
}
