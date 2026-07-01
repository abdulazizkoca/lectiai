import React from "react";
import StudentCamera from "@/components/StudentCamera";
import { GlobalBackButton } from "@/components/ui/GlobalBackButton";

export const metadata = {
  title: "Talaba Kamerasi | LectioAI",
  description: "Darsga ulanish va diqqatni tekshirish",
};

export default function StudentCameraPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <GlobalBackButton />

      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none bg-lapis" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none bg-saffron" />

      <div className="w-full max-w-4xl z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-display mb-4 bg-clip-text text-transparent bg-gradient-to-r from-saffron to-lapis">
            Real-Vaqt Diqqat Monitoringi
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Ushbu sahifa orqali yuzingizni ro&apos;yxatdan o&apos;tkazishingiz va professorga jonli dars
            jarayonida diqqat holatingizni yuborishingiz mumkin.
          </p>
        </div>

        <StudentCamera isPhoneAllowed={false} />
      </div>
    </div>
  );
}
