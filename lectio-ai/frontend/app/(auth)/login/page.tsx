"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import Logo from "@/components/Logo";
import { authAPI } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const lang = language as "uz" | "ru" | "en";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  const fg      = isDark ? "#fff"              : "#0A0A0F";
  const fgMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.03)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError(lang === "uz" ? "To'g'ri email kiriting" : lang === "ru" ? "Введите корректный email" : "Enter a valid email");
      return;
    }
    if (!password) {
      setError(lang === "uz" ? "Parolni kiriting" : lang === "ru" ? "Введите пароль" : "Enter your password");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem("lectio_token", data.access_token);
      router.push(data.user?.role === "professor" ? "/professor/dashboard" : "/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === "uz" ? "Kirishda xatolik" : lang === "ru" ? "Ошибка входа" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: isDark ? "#0A0A0F" : "#F8FAFC" }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-64 md:w-96 h-64 md:h-96 rounded-full opacity-[0.05] md:opacity-[0.07] blur-[40px] md:blur-[80px]"
          style={{ background: "#F5A623" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-48 md:w-80 h-48 md:h-80 rounded-full opacity-[0.03] md:opacity-[0.05] blur-[40px] md:blur-[80px]"
          style={{ background: "#1B4FD8" }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{ background: surface, border: `1px solid ${surfaceBorder}`, color: isDark ? "#F5A623" : "#1B4FD8" }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <Logo
              size={40}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-2xl font-bold" style={{ color: fg }}>Lectio <span className="text-[#F5A623]">AI</span></span>
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: fg }}>
            {lang === "uz" ? "Xush kelibsiz! 👋" : lang === "ru" ? "Добро пожаловать! 👋" : "Welcome back! 👋"}
          </h1>
          <p className="text-sm" style={{ color: fgMuted }}>
            {lang === "uz" ? "Darslarni davom ettirish uchun kiring" : lang === "ru" ? "Войдите, чтобы продолжить учёбу" : "Sign in to continue learning"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleLogin}
          className="rounded-3xl p-8 space-y-5"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${surfaceBorder}`, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-xl text-sm"
              style={{ background: "rgba(232,72,85,0.1)", border: "1px solid rgba(232,72,85,0.2)", color: "#E84855" }}
            >
              ⚠ {error}
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: fgMuted }}>
              {lang === "uz" ? "Email" : lang === "ru" ? "Email" : "Email"}
            </label>
            <input
              type="email"
              required
              placeholder="talaba@univer.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: inputBg, border: `1px solid ${surfaceBorder}`, color: fg }}
              onFocus={(e) => { e.target.style.borderColor = "#F5A623"; e.target.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = surfaceBorder; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: fgMuted }}>
              {lang === "uz" ? "Parol" : lang === "ru" ? "Пароль" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                style={{ background: inputBg, border: `1px solid ${surfaceBorder}`, color: fg }}
                onFocus={(e) => { e.target.style.borderColor = "#F5A623"; e.target.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = surfaceBorder; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all"
                style={{ color: fgMuted }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: fgMuted }}>
              <input type="checkbox" className="rounded" style={{ accentColor: "#F5A623" }} />
              {lang === "uz" ? "Eslab qolish" : lang === "ru" ? "Запомнить" : "Remember me"}
            </label>
            <Link href="#" className="font-medium hover:underline transition-all" style={{ color: "#1B4FD8" }}>
              {lang === "uz" ? "Parolni unutdingizmi?" : lang === "ru" ? "Забыли пароль?" : "Forgot password?"}
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? "rgba(245,166,35,0.6)" : "linear-gradient(135deg,#F5A623,#e8941a)",
              boxShadow: "0 4px 15px rgba(245,166,35,0.3)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {lang === "uz" ? "Kirish" : lang === "ru" ? "Войти" : "Sign in"}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: fgMuted }}>
            {lang === "uz" ? "Hisobingiz yo'qmi?" : lang === "ru" ? "Нет аккаунта?" : "Don't have an account?"}{" "}
            <Link href="/register" className="font-bold hover:underline transition-all" style={{ color: fg }}>
              {lang === "uz" ? "Ro'yxatdan o'tish" : lang === "ru" ? "Зарегистрироваться" : "Sign up"}
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
