import React from "react";
import TeacherDashboard from "@/components/TeacherDashboard";
import { GlobalBackButton } from "@/components/ui/GlobalBackButton";

export const metadata = {
  title: "Jonli Dars Boshqaruvi | LectioAI",
  description: "O'quvchilar diqqatini kuzatish paneli",
};

export default function TeacherDashboardPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center p-6 lg:p-12"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <GlobalBackButton />

      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none bg-amethyst" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none bg-coral" />

      <div className="w-full max-w-6xl z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-display mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amethyst to-coral">
            Jonli Dars Boshqaruvi
          </h1>
          <p className="max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            Sinfdagi barcha o&apos;quvchilarning real vaqt rejimidagi diqqat darajasini, zerikish yoki
            tushunmovchilik holatlarini kuzatib boring.
          </p>
        </div>

        <TeacherDashboard roomCode="TEST01" />
      </div>
    </div>
  );
}
