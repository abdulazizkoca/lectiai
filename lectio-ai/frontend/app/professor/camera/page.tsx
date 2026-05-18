import React from "react";
import TeacherDashboard from "@/components/TeacherDashboard";
import GlobalBackButton from "@/components/ui/GlobalBackButton";

export const metadata = {
  title: "Professor Dashboard | LectioAI",
  description: "O'quvchilar diqqatini kuzatish paneli",
};

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen text-white bg-[#0f172a] relative overflow-hidden flex flex-col items-center p-6 lg:p-12">
      <GlobalBackButton />
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none bg-[#8b5cf6]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] pointer-events-none bg-[#ec4899]" />

      <div className="w-full max-w-6xl z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Jonli Dars Boshqaruvi
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Sinfdagi barcha o'quvchilarning real vaqt rejimidagi diqqat darajasini, zerikish yoki tushunmovchilik holatlarini kuzatib boring.
          </p>
        </div>

        <TeacherDashboard roomCode="TEST01" />
      </div>
    </div>
  );
}
