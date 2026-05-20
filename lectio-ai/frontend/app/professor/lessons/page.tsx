"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Filter, Calendar, Users, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfessorLessonsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [savedLessons, setSavedLessons] = useState<any[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    setSavedLessons(JSON.parse(localStorage.getItem("lectio_professor_lessons") || "[]"));
  }, []);

  const mockLessons = [
    {
      id: 1,
      title: t("mock.lesson1.title"),
      topic: t("mock.lesson1.topic"),
      students: 45,
      duration: 90,
      status: "active",
      nextSession: t("mock.lesson1.time"),
      progress: 75,
    },
    {
      id: 2,
      title: t("mock.lesson2.title"),
      topic: t("mock.lesson2.topic"),
      students: 32,
      duration: 120,
      status: "preparing",
      nextSession: t("mock.lesson2.time"),
      progress: 45,
    },
    {
      id: 3,
      title: t("mock.lesson3.title"),
      topic: t("mock.lesson3.topic"),
      students: 28,
      duration: 60,
      status: "completed",
      nextSession: t("lessons.status_completed"),
      progress: 100,
    },
    {
      id: 4,
      title: t("mock.lesson4.title"),
      topic: t("mock.lesson4.topic"),
      students: 38,
      duration: 90,
      status: "active",
      nextSession: t("mock.lesson4.time"),
      progress: 60,
    },
  ];

  const allLessons = [
    ...savedLessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      topic: lesson.topic,
      students: 0,
      duration: lesson.duration,
      status: lesson.status || "preparing",
      nextSession: new Date(lesson.createdAt).toLocaleDateString(),
      progress: lesson.progress || 0,
    })),
    ...mockLessons,
  ];

  const filteredLessons = allLessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || lesson.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleManageLesson = (lesson: typeof mockLessons[0]) => {
    addToast({
      title: `${lesson.title} — ${t("lessons.manage")}`,
      description: t("lessons.manage_panel"),
      type: "info",
    });
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("lessons.title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t("lessons.subtitle")}</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => router.push("/professor/create-lesson")}
        >
          {t("lesson.create")}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            label=""
            placeholder={t("lessons.search")}
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
              {filter === "all" && t("lessons.filter_all")}
              {filter === "active" && t("lessons.filter_active")}
              {filter === "preparing" && t("lessons.filter_preparing")}
              {filter === "completed" && t("lessons.filter_completed")}
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
                {lesson.status === "active" && t("lessons.status_active")}
                {lesson.status === "preparing" && t("lessons.status_preparing")}
                {lesson.status === "completed" && t("lessons.status_completed")}
              </Badge>
            </div>

            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{lesson.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{lesson.topic}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users size={14} />
                  {lesson.students} {t("lessons.students")}
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock size={14} />
                  {lesson.duration} {t("lessons.minutes")}
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
                  <span className="text-slate-500 dark:text-slate-400">{t("lessons.progress")}</span>
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
                {t("lessons.manage")}
              </Button>
              {lesson.status !== "completed" && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => router.push("/professor/live")}
                >
                  {t("lesson.start")}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{t("lessons.not_found_title")}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {searchTerm ? t("lessons.not_found_search").replace("{query}", searchTerm) : t("lessons.not_found_empty")}
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => router.push("/professor/create-lesson")}
          >
            {t("lesson.create")}
          </Button>
        </div>
      )}
    </div>
  );
}
