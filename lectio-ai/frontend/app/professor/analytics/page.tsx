"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, Calendar as CalendarIcon, Filter, X, 
  TrendingUp, TrendingDown, Users, BookOpen, Eye, Target, MessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from "recharts";

// Mock Data
const timelineData = [
  { time: "00:00", attention: 85, event: "Dars boshlandi" },
  { time: "10:00", attention: 90 },
  { time: "20:00", attention: 82 },
  { time: "30:00", attention: 65, event: "Diqqat pasaydi" },
  { time: "35:00", attention: 88, event: "Jonli Quiz (Polling)" },
  { time: "45:00", attention: 75 },
  { time: "60:00", attention: 70 },
  { time: "70:00", attention: 55, event: "Charchoq" },
  { time: "75:00", attention: 80, event: "WOW Fakt ko'rsatildi" },
  { time: "80:00", attention: 78 },
];

const difficultyData = [
  { question: "Q-12: Kvant Entropiya", correct: 25, total: 100, difficulty: "hard" },
  { question: "Q-08: Zichlik formulasi", correct: 40, total: 100, difficulty: "hard" },
  { question: "Q-03: Kinetik energiya", correct: 65, total: 100, difficulty: "medium" },
  { question: "Q-01: Asosiy tushunchalar", correct: 95, total: 100, difficulty: "easy" },
];

const studentsData = [
  { id: 1, name: "Jasur Karimov", topics: [90, 85, 40, 95] },
  { id: 2, name: "Malika Aliyeva", topics: [88, 92, 85, 90] },
  { id: 3, name: "Aziz Tohirov", topics: [45, 60, 55, 70] },
  { id: 4, name: "Sarvar Davlatov", topics: [95, 95, 90, 100] },
  { id: 5, name: "Nigina Umarova", topics: [70, 75, 65, 80] },
];
const topics = ["Termodinamika 1", "Termodinamika 2", "Entropiya", "Kinetika"];

export default function AnalyticsDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const getHeatmapColor = (score: number) => {
    if (score >= 80) return "bg-[#0D9373]/20 text-[#0D9373]";
    if (score >= 60) return "bg-[#F5A623]/20 text-[#F5A623]";
    return "bg-[#E84855]/20 text-[#E84855]";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 font-body text-slate-900 dark:text-white">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold">Analitika</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" leftIcon={<CalendarIcon size={16} />}>Ushbu Hafta</Button>
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filtrlar</Button>
          <Button variant="primary" leftIcon={<Download size={16} />}>PDF Yuklash</Button>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Jami darslar" value="24" icon={<BookOpen size={20} />} trend="↑ 2" trendUp={true} color="lapis" />
        <MetricCard title="O'rtacha diqqat" value="78%" icon={<Eye size={20} />} trend="↓ 3%" trendUp={false} color="jade" />
        <MetricCard title="Test o'rtacha bali" value="82.4" icon={<Target size={20} />} trend="↑ 4.1" trendUp={true} color="saffron" />
        <MetricCard title="Aktiv talabalar" value="156" icon={<Users size={20} />} trend="95% retention" trendUp={true} color="amethyst" />
      </div>

      {/* SECTION 2: ATTENTION TIMELINE */}
      <section>
        <h2 className="text-xl font-display font-bold mb-6">Dars davomidagi o'rtacha diqqat (Timeline)</h2>
        <Card className="h-96">
          <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                labelStyle={{ color: '#F5A623', marginBottom: '4px' }}
              />
              <ReferenceLine y={70} stroke="#E84855" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Kritik chegara (70%)', fill: '#E84855', fontSize: 12 }} />
              <Line 
                type="monotone" 
                dataKey="attention" 
                stroke="#0D9373" 
                strokeWidth={4}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.event) {
                    return <circle cx={cx} cy={cy} r={6} fill="#F5A623" stroke="#18181F" strokeWidth={3} />;
                  }
                  return <circle cx={cx} cy={cy} r={0} />;
                }}
                activeDot={{ r: 8, fill: '#0D9373', stroke: '#18181F', strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 3: TOPIC HEATMAP */}
        <section>
          <h2 className="text-xl font-display font-bold mb-6">Mavzular bo'yicha o'zlashtirish xaritasi</h2>
          <Card className="overflow-x-auto p-0 border-none shadow-xl border border-black/5 dark:border-white/5">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FAFAF7] dark:bg-[#18181F] text-slate-500 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Talaba</th>
                  {topics.map(t => <th key={t} className="px-6 py-4">{t}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-white dark:bg-[#0C0C14]">
                {studentsData.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedStudent(student)}>
                    <td className="px-6 py-4 font-bold">{student.name}</td>
                    {student.topics.map((score, i) => (
                      <td key={i} className="px-6 py-4">
                        <div className={`px-3 py-1.5 rounded-lg font-bold text-center ${getHeatmapColor(score)}`}>
                          {score}%
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* SECTION 4: QUESTION DIFFICULTY */}
        <section>
          <h2 className="text-xl font-display font-bold mb-6">Savollar qiyinlik tahlili</h2>
          <Card className="flex flex-col h-full">
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={difficultyData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="question" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} width={180} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18181F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }} />
                  <Bar dataKey="correct" radius={[0, 4, 4, 0]} barSize={24}>
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.difficulty === 'hard' ? '#E84855' : entry.difficulty === 'medium' ? '#F5A623' : '#0D9373'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-[#18181F] p-5 rounded-xl border border-slate-800 flex items-start gap-4 mt-auto">
              <div className="bg-[#E84855]/20 p-2 rounded-lg text-[#E84855] shrink-0 mt-1"><Target size={20} /></div>
              <div>
                <h4 className="font-bold text-[#E84855] mb-1">AI Tavsiyasi</h4>
                <p className="text-sm text-slate-300">Bu 2 ta savol (Q-12, Q-08) juda qiyin keldi. "Kvant Entropiya" va "Zichlik formulasi"ni qayta tushuntirishingiz tavsiya etiladi.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* SECTION 6: TIME-OF-DAY ANALYSIS */}
      <section>
        <h2 className="text-xl font-display font-bold mb-6">Hafta kunlari va soatlar kesimida faollik xaritasi</h2>
        <Card>
          <div className="h-48 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-500 font-bold">
            [ Heatmap Visualization Components: 24h x 7d Matrix ]
          </div>
          <p className="text-center mt-4 text-[#F5A623] font-bold">💡 Sizning guruhingiz Chorshanba 10:00-12:00 oralig'ida eng yuqori diqqatni namoyon etadi.</p>
        </Card>
      </section>

      {/* SECTION 5: STUDENT DRILL-DOWN PANEL (Slide-over) */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#FAFAF7] dark:bg-[#0C0C14] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#18181F]">
                <h3 className="font-display font-bold text-xl">Talaba Profili</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-white p-2 bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                <div className="flex items-center gap-4">
                  <Avatar initials={selectedStudent.name.split(' ').map((n: string) => n[0]).join('')} size="xl" className="border-4 border-[#1B4FD8]" />
                  <div>
                    <h2 className="text-2xl font-bold font-display">{selectedStudent.name}</h2>
                    <p className="text-[#F5A623] font-bold text-sm">Faol talaba • 15 kunlik Streak 🔥</p>
                  </div>
                </div>

                <div className="bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 p-5 rounded-xl flex gap-4">
                  <MessageSquare className="text-[#1B4FD8] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-[#1B4FD8] mb-1">Shaxsiy tavsiya</h4>
                    <p className="text-sm text-slate-300 mb-3">{selectedStudent.name} "Entropiya" mavzusida biroz qiynalmoqda (40%). Qo'shimcha materiallar yuborish tavsiya etiladi.</p>
                    <Button variant="primary" size="sm">Telegram orqali xabar yozish</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4">O'zlashtirish tafsiloti</h4>
                  <div className="space-y-3">
                    {selectedStudent.topics.map((score: number, idx: number) => (
                      <div key={idx} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                        <span className="font-bold">{topics[idx]}</span>
                        <Badge color={score >= 80 ? "jade" : score >= 60 ? "saffron" : "coral"} variant="solid">
                          {score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp, color }: any) {
  const colorMap: any = {
    lapis: "text-[#1B4FD8] bg-[#1B4FD8]/10",
    jade: "text-[#0D9373] bg-[#0D9373]/10",
    saffron: "text-[#F5A623] bg-[#F5A623]/10",
    amethyst: "text-[#7B2FBE] bg-[#7B2FBE]/10",
  };

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-[#0D9373]/20 text-[#0D9373]' : 'bg-[#E84855]/20 text-[#E84855]'}`}>
          {trend}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-mono font-bold mb-1">{value}</h3>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
      </div>
    </Card>
  );
}
