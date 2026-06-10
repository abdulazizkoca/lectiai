"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sun, Moon, Trash2, User, Users, ShieldAlert, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import { authAPI } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { toasts, addToast, removeToast } = useToast();
  const lang = language as "uz" | "ru" | "en";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  const fg = isDark ? "#fff" : "#0A0A0F";
  const fgMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const surface = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const surfaceBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  // 1. Initialize and load standard accounts list on mount
  useEffect(() => {
    const defaultAccounts = [
      { email: "professor@lectio.ai", role: "professor", name: "Prof. Aziz (Host)" },
      { email: "student@lectio.ai", role: "student", name: "Sardor (Mehmon)" }
    ];
    const stored = localStorage.getItem("lectio_saved_accounts");
    if (stored) {
      // Eski yozuvlardan parol maydonini tozalash
      const parsed = JSON.parse(stored);
      const cleaned = parsed.map(({ password: _pw, ...rest }: any) => rest);
      setSavedAccounts(cleaned);
    } else {
      localStorage.setItem("lectio_saved_accounts", JSON.stringify(defaultAccounts));
      setSavedAccounts(defaultAccounts);
    }
  }, []);

  // Helper: Save account email/role/name (parol saqlanmaydi)
  const saveToAccountsList = (userEmail: string, role: string, name: string) => {
    const newAccount = { email: userEmail, role, name };
    const updated = [
      ...savedAccounts.filter((acc: any) => acc.email !== userEmail),
      newAccount,
    ];
    localStorage.setItem("lectio_saved_accounts", JSON.stringify(updated));
    setSavedAccounts(updated);
  };

  // 2. Main Login request handler
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
      const data = await authAPI.login(email.trim(), password);
      localStorage.setItem("lectio_token", data.access_token);
      if (data.user) {
        localStorage.setItem("lectio_user", JSON.stringify(data.user));
      }

      const role = data.user?.role || "student";
      const name = data.user?.full_name || (role === "professor" ? "Professor (Host)" : "Talaba (Mehmon)");

      saveToAccountsList(email.trim(), role, name);

      addToast({
        title: lang === "uz" ? "Muvaffaqiyat" : "Успешно",
        description: lang === "uz" ? "Tizimga muvaffaqiyatli kirdingiz" : "Вы успешно вошли в систему",
        type: "success"
      });

      router.push(role === "professor" ? "/professor/dashboard" : "/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (lang === "uz" ? "Kirishda xatolik" : "Ошибка входа"));
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick select account — faqat email to'ldiriladi, parol qo'lda kiritiladi
  const handleSelectAccount = (account: any) => {
    setEmail(account.email);
    setPassword("");
    addToast({
      title: "Akkaunt tanlandi",
      description: `${account.email} — parolingizni kiriting`,
      type: "info"
    });
  };

  // 4. Remove account from standard stored list
  const handleRemoveAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc.email !== emailToRemove);
    localStorage.setItem("lectio_saved_accounts", JSON.stringify(updated));
    setSavedAccounts(updated);
    addToast({
      title: "Akkaunt o'chirildi",
      description: `${emailToRemove} eslab qolinganlar ro'yxatidan olib tashlandi`,
      type: "warning"
    });
  };

  // 5. Host/Guest Quick Login — email ni form ga to'ldiradi
  const handleQuickLogin = (role: "professor" | "student") => {
    const mockEmail = role === "professor" ? "professor@lectio.ai" : "student@lectio.ai";
    setEmail(mockEmail);
    setPassword("");
    addToast({
      title: "Tezkor to'ldirish",
      description: `${mockEmail} — parolingizni kiriting va Kirish tugmasini bosing`,
      type: "info"
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{ background: isDark ? "#0A0A0F" : "#F8FAFC" }}
    >
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04] md:opacity-[0.06] blur-[100px]"
          style={{ background: "#F5A623" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.03] md:opacity-[0.05] blur-[100px]"
          style={{ background: "#1B4FD8" }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 border border-white/10 text-[#F5A623] hover:scale-105 active:scale-95"
        style={{ color: isDark ? "#F5A623" : "#1B4FD8" }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Stored / Saved Accounts ("standart akkauntlar ro'yxati") */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-3xl backdrop-blur-md border border-white/10 flex-1 bg-white/5 dark:bg-black/35"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-[#F5A623] w-5 h-5" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Eslab qolinganlar</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Tezkor kirish uchun quyidagi ro'yxatdan akkaunt tanlang yoki ularni o'chiring. Yangi kirgan akkauntlar avtomatik saqlanadi.
            </p>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {savedAccounts.map((acc) => (
                  <motion.div
                    key={acc.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleSelectAccount(acc)}
                    className="p-3.5 rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 hover:border-white/20 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                        acc.role === "professor" ? "bg-indigo-500/20 text-indigo-300" : "bg-[#0D9373]/20 text-[#0D9373]"
                      }`}>
                        {acc.role === "professor" ? "Host" : "Guest"}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white truncate max-w-[150px]">{acc.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{acc.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveAccount(acc.email, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                      title="Akkauntni o'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {savedAccounts.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Saqlangan akkauntlar yo'q</p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#F5A623]" /> Tezkor Mehmon Rejimi
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin("professor")}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/40 text-indigo-300 text-xs font-bold transition active:scale-95"
              >
                <User size={16} className="mb-1" />
                Host (Professor)
              </button>
              <button
                onClick={() => handleQuickLogin("student")}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-cyan-300 text-xs font-bold transition active:scale-95"
              >
                <Users size={16} className="mb-1" />
                Guest (Talaba)
              </button>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Main Credentials Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 flex flex-col justify-center"
        >
          {/* Logo and Header */}
          <div className="text-center lg:text-left mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group justify-center lg:justify-start">
              <Logo size={40} className="transition-transform duration-300 group-hover:scale-110" />
              <span className="text-2xl font-bold" style={{ color: fg }}>
                Lectio <span className="text-[#F5A623]">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: fg }}>
              {lang === "uz" ? "Platformaga kirish 👋" : lang === "ru" ? "Войти в платформу 👋" : "Platform Login 👋"}
            </h1>
            <p className="text-sm" style={{ color: fgMuted }}>
              {lang === "uz" ? "Darslarni davom ettirish uchun hisobingizga kiring" : "Войдите, чтобы продолжить учёбу"}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="rounded-3xl p-6 md:p-8 space-y-5 bg-white dark:bg-white/5 border dark:border-white/10"
            style={{
              borderColor: isDark ? "transparent" : surfaceBorder,
              boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.06)"
            }}
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3.5 rounded-xl text-sm flex items-center gap-2 border border-red-500/20 bg-red-500/10 text-red-400"
              >
                <ShieldAlert size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {lang === "uz" ? "Email Manzil" : "Email"}
              </label>
              <input
                type="email"
                required
                placeholder="talaba@univer.uz"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: inputBg, border: `1px solid ${surfaceBorder}`, color: fg }}
                onFocus={(e) => { e.target.style.borderColor = "#F5A623"; e.target.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = surfaceBorder; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {lang === "uz" ? "Parol" : "Пароль"}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{ background: inputBg, border: `1px solid ${surfaceBorder}`, color: fg }}
                  onFocus={(e) => { e.target.style.borderColor = "#F5A623"; e.target.style.boxShadow = "0 0 0 3px rgba(245,166,35,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = surfaceBorder; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Actions: Remember & Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="checkbox" className="rounded bg-black/40 border-white/10" style={{ accentColor: "#F5A623" }} defaultChecked />
                {lang === "uz" ? "Eslab qolish" : "Запомнить"}
              </label>
              <Link href="#" className="font-semibold hover:underline text-[#1B4FD8]">
                {lang === "uz" ? "Parolni unutdingizmi?" : "Забыли пароль?"}
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full py-3.5 rounded-xl font-bold text-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#F5A623,#e8941a)",
                boxShadow: "0 4px 15px rgba(245,166,35,0.25)"
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {lang === "uz" ? "Kirish" : "Войти"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Register redirection link */}
            <p className="text-center text-sm text-slate-400">
              {lang === "uz" ? "Hisobingiz yo'qmi?" : "Нет аккаунта?"}{" "}
              <Link href="/register" className="font-bold hover:underline text-white">
                {lang === "uz" ? "Ro'yxatdan o'tish" : "Зарегистрироваться"}
              </Link>
            </p>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
