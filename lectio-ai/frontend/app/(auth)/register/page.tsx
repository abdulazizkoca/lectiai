"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sun, Moon } from "lucide-react";
import Logo from "@/components/Logo";
import { authAPI } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const lang = language as "uz" | "ru" | "en";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.full_name.trim() || formData.full_name.trim().length < 3) {
      setError("F.I.SH. kamida 3 ta belgidan iborat bo'lishi kerak");
      setLoading(false);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("To'g'ri email manzilini kiriting");
      setLoading(false);
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.register(formData);
      localStorage.setItem("lectio_token", data.access_token);

      const newAccount = { email: formData.email, role: formData.role, name: formData.full_name };
      const stored = localStorage.getItem("lectio_saved_accounts");
      const currentSaved = stored ? JSON.parse(stored) : [];
      localStorage.setItem(
        "lectio_saved_accounts",
        JSON.stringify([...currentSaved.filter((a: any) => a.email !== formData.email), newAccount])
      );

      router.push(data.user.role === "professor" ? "/professor/dashboard" : "/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fg = isDark ? "var(--foreground)" : "var(--foreground)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: "var(--saffron)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: "var(--amethyst)" }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: isDark ? "var(--saffron)" : "var(--lapis)",
        }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Logo size={36} className="transition-transform duration-300 group-hover:scale-110" />
            <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              Lectio <span className="text-saffron">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--foreground)" }}>
            {lang === "ru" ? "Присоединиться 🚀" : lang === "en" ? "Join Platform 🚀" : "Platformaga qo'shiling 🚀"}
          </h1>
          <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Самая современная образовательная платформа" : lang === "en" ? "The most advanced education platform" : "Dunyodagi eng zamonaviy ta'lim platformasi"}
          </p>
        </motion.div>

        {/* Form card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleRegister}
          className="rounded-3xl p-6 md:p-8 space-y-5"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${surfaceBorder}`,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {error && (
            <div className="p-3.5 rounded-xl text-sm flex items-center gap-2 border border-coral/20 bg-coral/10 text-coral">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={lang === "ru" ? "Полное имя" : lang === "en" ? "Full Name" : "F.I.SH."}
              type="text"
              required
              placeholder={lang === "ru" ? "Например: Jasur Alimov" : "Masalan: Jasur Alimov"}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <Input
              label={lang === "ru" ? "Email адрес" : lang === "en" ? "Email Address" : "Email manzilingiz"}
              type="email"
              required
              placeholder="talaba@univer.uz"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label={lang === "ru" ? "Пароль" : lang === "en" ? "Password" : "Parol"}
              type="password"
              required
              placeholder={lang === "ru" ? "Минимум 6 символов" : "Kamida 6 belgi"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {/* Role selection */}
            <div>
              <label
                className="block text-sm font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}
              >
                {lang === "ru" ? "Роль" : lang === "en" ? "Role" : "Rolingiz"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "student" })}
                  className="p-3 rounded-xl border text-sm font-semibold transition-all"
                  style={{
                    borderColor: formData.role === "student" ? "var(--jade)" : surfaceBorder,
                    background: formData.role === "student" ? "rgba(13,147,115,0.12)" : inputBg,
                    color: formData.role === "student" ? "var(--jade)" : "var(--muted-foreground)",
                    boxShadow: formData.role === "student" ? "0 0 15px rgba(13,147,115,0.15)" : "none",
                  }}
                >
                  👨‍🎓 {lang === "ru" ? "Студент" : lang === "en" ? "Student" : "Talaba"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "professor" })}
                  className="p-3 rounded-xl border text-sm font-semibold transition-all"
                  style={{
                    borderColor: formData.role === "professor" ? "var(--lapis)" : surfaceBorder,
                    background: formData.role === "professor" ? "rgba(27,79,216,0.12)" : inputBg,
                    color: formData.role === "professor" ? "var(--lapis)" : "var(--muted-foreground)",
                    boxShadow: formData.role === "professor" ? "0 0 15px rgba(27,79,216,0.15)" : "none",
                  }}
                >
                  👩‍🏫 {lang === "ru" ? "Профессор" : lang === "en" ? "Professor" : "Professor"}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,var(--saffron),#e8941a)",
              boxShadow: "0 4px 15px rgba(245,166,35,0.25)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {lang === "ru" ? "Зарегистрироваться" : lang === "en" ? "Register" : "Ro'yxatdan o'tish"}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ru" ? "Уже есть аккаунт?" : lang === "en" ? "Already have an account?" : "Allaqachon hisobingiz bormi?"}{" "}
            <Link href="/login" className="font-bold text-saffron hover:underline transition-colors">
              {lang === "ru" ? "Войти" : lang === "en" ? "Login" : "Kirish"}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
