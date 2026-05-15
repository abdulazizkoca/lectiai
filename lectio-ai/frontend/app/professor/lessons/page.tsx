"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Filter, Calendar, Users, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

export default function ProfessorLessonsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { toasts, addToast, removeToast } = useToast();

  const mockLessons = [
    {
      id: 1,
      title: "Ma'lumotlar bazasi asoslari",
      topic: "SQL va relational ma'lumotlar bazalari",
      students: 45,
      duration: 90,
      status: "active",
      nextSession: "Tomorrow 14:00",
      progress: 75,
    },
    {
      id: 2,
      title: "Dasturiy ta'minot muhandisligi",
      topic: "Agile metodologiyalar va SCRUM",
      students: 32,
      duration: 120,
      status: "preparing",
      nextSession: "Friday 10:00",
      progress: 45,
    },
    {
      id: 3,
      title: "Web dasturlash",
      topic: "React va Next.js asoslari",
      students: 28,
      duration: 60,
      status: "completed",
      nextSession: "Tugatilgan",
      progress: 100,
    },
    {
      id: 4,
      title: "Algoritm va ma'lumotlar tuzilmasi",
      topic: "Sort, search va graph algoritmlar",
      students: 38,
      duration: 90,
      status: "active",
      nextSession: "Monday 09:00",
      progress: 60,
    },
  ];

  const filteredLessons = mockLessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || lesson.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleManageLesson = (lesson: typeof mockLessons[0]) => {
    addToast({
      title: `${lesson.title} — Boshqaruv`,
      description: "Dars boshqaruv paneli tez orada ishga tushadi.",
      type: "info",
    });
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mening darslarim</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Barcha darslaringizni boshqaring</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => router.push("/professor/create-lesson")}
        >
          Yangi dars yaratish
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            label=""
            placeholder="Darslarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "preparing", "completed"].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? "bg-[#F5A623] text-black"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20"
              }`}
            >
              {filter === "all" && "Barchasi"}
              {filter === "active" && "Faol"}
              {filter === "preparing" && "Tayyorlanmoqda"}
              {filter === "completed" && "Tugatilgan"}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#F5A623]/10 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-[#F5A623]" />
              </div>
              <Badge
                color={lesson.status === "active" ? "jade" : lesson.status === "preparing" ? "saffron" : "gray"}
                size="sm"
              >
                {lesson.status === "active" && "Faol"}
                {lesson.status === "preparing" && "Tayyorlanmoqda"}
                {lesson.status === "completed" && "Tugatilgan"}
              </Badge>
            </div>

            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{lesson.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{lesson.topic}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users size={14} />
                  {lesson.students} talaba
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock size={14} />
                  {lesson.duration} daqiqa
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar size={14} />
                  {lesson.nextSession}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="text-slate-900 dark:text-white font-medium">{lesson.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                  <div
                    className="bg-[#F5A623] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => handleManageLesson(lesson)}
              >
                Boshqarish
              </Button>
              {lesson.status !== "completed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => router.push("/professor/live")}
                >
                  Boshlash
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Darslar topilmadi</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {searchTerm ? `"${searchTerm}" bo'yicha natijalar yo'q` : "Hali darslar yaratilmagan"}
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => router.push("/professor/create-lesson")}
          >
            Yangi dars yaratish
          </Button>
        </div>
      )}
    </div>
  );
}
