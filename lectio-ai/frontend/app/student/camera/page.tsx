import React from "react";
import StudentCamera from "@/components/StudentCamera";
import GlobalBackButton from "@/components/ui/GlobalBackButton";

export const metadata = {
  title: "Talaba Kamerasi | LectioAI",
  description: "Darsga ulanish va diqqatni tekshirish",
};

export default function StudentCameraPage() {
  return (
    <div className="min-h-screen text-white bg-[#0f172a] relative overflow-hidden flex flex-col items-center justify-center p-6">
      <GlobalBackButton />
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none bg-[#3b82f6]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none bg-[#f5a623]" />

      <div className="w-full max-w-4xl z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Real-Vaqt Diqqat Monitoringi
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Ushbu sahifa orqali yuzingizni ro'yxatdan o'tkazishingiz va professorga jonli dars jarayonida diqqat holatingizni yuborishingiz mumkin.
          </p>
        </div>

        <StudentCamera roomCode="TEST01" />
      </div>
    </div>
  );
}
