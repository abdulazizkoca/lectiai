"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Form validation
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
      
      // Save this registered account to stored accounts list (no password stored)
      const newAccount = {
        email: formData.email,
        role: formData.role,
        name: formData.full_name,
      };
      const stored = localStorage.getItem("lectio_saved_accounts");
      const currentSaved = stored ? JSON.parse(stored) : [];
      const updated = [...currentSaved.filter((acc: any) => acc.email !== formData.email), newAccount];
      localStorage.setItem("lectio_saved_accounts", JSON.stringify(updated));

      if (data.user.role === "professor") {
        router.push("/professor/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Xatolik yuz berdi");
      } else {
        setError("Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 slide-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#e8941a] flex items-center justify-center font-display font-bold text-black shrink-0 shadow-lg shadow-[#F5A623]/20">
              L
            </div>
            <span className="text-2xl font-bold gradient-text">Lectio AI</span>
          </Link>
          <h1 className="text-2xl font-bold">Platformaga qo&apos;shiling 🚀</h1>
          <p className="text-slate-400 mt-2">Dunyodagi eng zamonaviy ta&apos;lim platformasi</p>
        </div>

        <form onSubmit={handleRegister} className="glass-card p-8 space-y-6 slide-up slide-up-delay-1">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="F.I.SH."
              type="text"
              required
              placeholder="Masalan: Jasur Alimov"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
            <Input
              label="Email manzilingiz"
              type="email"
              required
              placeholder="talaba@univer.uz"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input
              label="Parol"
              type="password"
              required
              placeholder="Kamida 6 belgi"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rolingiz</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: "student"})}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.role === "student" 
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  👨‍🎓 Talaba
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, role: "professor"})}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.role === "professor" 
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  👩‍🏫 Professor
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Ro&apos;yxatdan o&apos;tish
          </Button>

          <p className="text-center text-sm text-slate-400">
            Allaqachon hisobingiz bormi?{" "}
            <Link href="/login" className="text-white hover:text-indigo-400 transition font-medium">
              Kirish
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
