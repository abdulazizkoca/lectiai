"use client";

import React, { useState } from "react";
import { Users, Search, Mail, Phone, Calendar, TrendingUp, Award, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

type Student = {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  progress: number;
  streak: number;
  lastActive: string;
  courses: number;
  status: string;
  performance: string;
};

export default function ProfessorStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const mockStudents: Student[] = [
    { id: 1, name: "Ali Karimov", email: "ali.karimov@univer.uz", phone: "+998 90 123 45 67", avatar: "AK", progress: 85, streak: 12, lastActive: "2 soat oldin", courses: 3, status: "active", performance: "excellent" },
    { id: 2, name: "Dilora Nazarova", email: "dilora.n@univer.uz", phone: "+998 91 234 56 78", avatar: "DN", progress: 72, streak: 8, lastActive: "1 kun oldin", courses: 2, status: "active", performance: "good" },
    { id: 3, name: "Bobur Toshmatov", email: "bobur.t@univer.uz", phone: "+998 93 345 67 89", avatar: "BT", progress: 45, streak: 3, lastActive: "3 kun oldin", courses: 1, status: "inactive", performance: "average" },
    { id: 4, name: "Gulnora Saidova", email: "gulnora.s@univer.uz", phone: "+998 94 456 78 90", avatar: "GS", progress: 93, streak: 20, lastActive: "30 daqiqa oldin", courses: 4, status: "active", performance: "excellent" },
  ];

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || student.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case "excellent": return { color: "jade" as const, text: "A'lo" };
      case "good": return { color: "lapis" as const, text: "Yaxshi" };
      case "average": return { color: "saffron" as const, text: "O'rtacha" };
      default: return { color: "gray" as const, text: "Noma'lum" };
    }
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      addToast({ title: "Xato", description: "Ism va email majburiy", type: "error" });
      return;
    }
    addToast({ title: "Talaba qo'shildi!", description: `${newStudentName} muvaffaqiyatli qo'shildi`, type: "success" });
    setIsAddingStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Talabalar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Barcha talabalarning faoliyatini kuzating</p>
        </div>
        <Button variant="primary" leftIcon={<Users size={16} />} onClick={() => setIsAddingStudent(true)}>
          Talaba qo'shish
        </Button>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddingStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setIsAddingStudent(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yangi talaba qo'shish</h2>
                  <button onClick={() => setIsAddingStudent(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <Input label="Ism va familiya" placeholder="Ali Karimov" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                  <Input label="Email" placeholder="ali@univer.uz" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} leftIcon={<Mail size={18} />} />
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setIsAddingStudent(false)}>Bekor qilish</Button>
                    <Button variant="primary" className="flex-1" onClick={handleAddStudent}>Qo'shish</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Student Detail Panel */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSelectedStudent(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0C0C14] border-l border-black/10 dark:border-white/10 shadow-2xl z-50 flex flex-col">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#18181F]">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Talaba profili</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar initials={selectedStudent.avatar} size="xl" status={selectedStudent.status === "active" ? "online" : "offline"} />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedStudent.email}</p>
                    <p className="text-[#F5A623] font-bold text-sm mt-1">🔥 {selectedStudent.streak} kunlik seriya</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 text-center"><p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStudent.progress}%</p><p className="text-xs text-slate-500 dark:text-slate-400">Progress</p></Card>
                  <Card className="p-4 text-center"><p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStudent.courses}</p><p className="text-xs text-slate-500 dark:text-slate-400">Kurslar</p></Card>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Mail size={14} />{selectedStudent.email}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Phone size={14} />{selectedStudent.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Calendar size={14} />So'nggi faollik: {selectedStudent.lastActive}</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" className="flex-1" leftIcon={<Mail size={16} />} onClick={() => { addToast({ title: "Xabar yuborildi", description: `${selectedStudent.name}ga email yuborildi`, type: "success" }); setSelectedStudent(null); }}>Xabar yuborish</Button>
                  <Button variant="secondary" className="flex-1" onClick={() => { addToast({ title: "Hisobot", description: "Talaba hisoboti tayyor bo'lganda bildirishma keladi", type: "info" }); }}>Hisobot</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-slate-500 dark:text-slate-400 text-sm">Jami talabalar</p><p className="text-2xl font-bold text-slate-900 dark:text-white">124</p></div><Users className="text-[#F5A623]" size={24} /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-slate-500 dark:text-slate-400 text-sm">Faol talabalar</p><p className="text-2xl font-bold text-slate-900 dark:text-white">98</p></div><TrendingUp className="text-green-600" size={24} /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-slate-500 dark:text-slate-400 text-sm">O'rtacha progress</p><p className="text-2xl font-bold text-slate-900 dark:text-white">73%</p></div><Award className="text-blue-600" size={24} /></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-slate-500 dark:text-slate-400 text-sm">O'rtacha seriya</p><p className="text-2xl font-bold text-slate-900 dark:text-white">8</p></div><Calendar className="text-purple-600" size={24} /></div></Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input placeholder="Talabalarni qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} leftIcon={<Search size={18} />} />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((filter) => (
            <button key={filter} onClick={() => setSelectedFilter(filter)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter ? "bg-[#F5A623] text-black" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"}`}>
              {filter === "all" && "Barchasi"}
              {filter === "active" && "Faol"}
              {filter === "inactive" && "Nofaol"}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Talaba</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Progress</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Seriya</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Kurslar</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Natija</th>
                <th className="text-left p-4 font-medium text-slate-700 dark:text-slate-300">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={student.avatar} status={student.status === "active" ? "online" : "offline"} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{student.progress}%</span>
                      <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                        <div className="bg-[#F5A623] h-2 rounded-full transition-all duration-300" style={{ width: `${student.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="flex items-center gap-2"><span className="font-medium text-slate-900 dark:text-white">{student.streak}</span><span className="text-sm text-slate-500 dark:text-slate-400">kun</span></div></td>
                  <td className="p-4"><span className="text-slate-900 dark:text-white">{student.courses}</span></td>
                  <td className="p-4"><Badge color={student.status === "active" ? "jade" : "gray"} size="sm">{student.status === "active" ? "Faol" : "Nofaol"}</Badge></td>
                  <td className="p-4"><Badge color={getPerformanceBadge(student.performance).color} size="sm">{getPerformanceBadge(student.performance).text}</Badge></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>Batafsil</Button>
                      <Button variant="ghost" size="sm" leftIcon={<Mail size={14} />} onClick={() => addToast({ title: "Xabar", description: `${student.name}ga email yuborildi`, type: "success" })}>Xabar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Talabalar topilmadi</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{searchTerm ? `"${searchTerm}" bo'yicha natijalar yo'q` : "Hali talabalar qo'shilmagan"}</p>
          <Button variant="primary" leftIcon={<Users size={16} />} onClick={() => setIsAddingStudent(true)}>Talaba qo'shish</Button>
        </div>
      )}
    </div>
  );
}
