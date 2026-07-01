"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Settings, Award, BookOpen, Users, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export default function ProfessorProfilePage() {
  const router = useRouter();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profil</h1>

      {/* Profile Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar initials="JD" size="xl" status="online" className="border-4 border-saffron" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Prof. John Doe</h2>
              <Badge color="saffron" size="sm">Premium</Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">john.doe@univer.uz</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Axborot texnologiyalari fakulteti • Toshkent universiteti</p>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3">
              Dasturiy ta'minot muhandisligi professori. 10+ yillik tajriba. AI va mashinali o'rganish sohasida ixtisoslashgan.
            </p>
          </div>
          <Button variant="secondary" leftIcon={<Settings size={16} />} onClick={() => router.push("/professor/settings")}>
            Sozlamalar
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Jami darslar", value: "24", icon: <BookOpen size={18} />, color: "text-saffron" },
          { label: "Talabalar", value: "124", icon: <Users size={18} />, color: "text-jade" },
          { label: "O'rtacha baho", value: "4.8★", icon: <Star size={18} />, color: "text-lapis" },
          { label: "Faollik", value: "92%", icon: <TrendingUp size={18} />, color: "text-amethyst" },
        ].map((stat, i) => (
          <Card key={i} className="p-4 text-center">
            <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-saffron" />
          Yutuqlar
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { emoji: "🔥", title: "30 kunlik streak", desc: "Ketma-ket 30 kun faol" },
            { emoji: "🎓", title: "100 ta talaba", desc: "100+ talabaga o'qitdi" },
            { emoji: "⚡", title: "AI Ustasi", desc: "50+ AI dars yaratdi" },
            { emoji: "🏆", title: "Top Professor", desc: "Reytingda 1-o'rin" },
            { emoji: "💬", title: "Faol muloqot", desc: "500+ savol javoblandi" },
            { emoji: "📊", title: "Analitik", desc: "Analitikadan aktiv foydalanish" },
          ].map((ach, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-start gap-3">
              <span className="text-2xl">{ach.emoji}</span>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{ach.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
