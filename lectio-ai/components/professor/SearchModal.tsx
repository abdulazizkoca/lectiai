"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, BookOpen, Users, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data for search
  const mockData = {
    lessons: [
      { id: 1, title: "Ma'lumotlar bazasi asoslari", topic: "SQL va relational ma'lumotlar bazalari", students: 45, status: "active" },
      { id: 2, title: "Dasturiy ta'minot muhandisligi", topic: "Agile metodologiyalar va SCRUM", students: 32, status: "preparing" },
      { id: 3, title: "Web dasturlash", topic: "React va Next.js asoslari", students: 28, status: "completed" }
    ],
    students: [
      { id: 1, name: "Ali Karimov", email: "ali.karimov@univer.uz", progress: 85, avatar: "AK", status: "active" },
      { id: 2, name: "Dilora Nazarova", email: "dilora.n@univer.uz", progress: 72, avatar: "DN", status: "active" },
      { id: 3, name: "Bobur Toshmatov", email: "bobur.t@univer.uz", progress: 45, avatar: "BT", status: "inactive" }
    ],
    materials: [
      { id: 1, title: "SQL asoslari PDF", type: "PDF", size: "2.4 MB", lessons: 3 },
      { id: 2, title: "React video darslik", type: "Video", size: "156 MB", lessons: 2 },
      { id: 3, title: "Agile metodologiya slaydlar", type: "PowerPoint", size: "5.1 MB", lessons: 1 }
    ]
  };

  const [filteredResults, setFilteredResults] = useState({
    lessons: [] as typeof mockData.lessons,
    students: [] as typeof mockData.students,
    materials: [] as typeof mockData.materials
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredResults({ lessons: [], students: [], materials: [] });
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      
      setFilteredResults({
        lessons: mockData.lessons.filter(lesson => 
          lesson.title.toLowerCase().includes(term) || 
          lesson.topic.toLowerCase().includes(term)
        ),
        students: mockData.students.filter(student => 
          student.name.toLowerCase().includes(term) || 
          student.email.toLowerCase().includes(term)
        ),
        materials: mockData.materials.filter(material => 
          material.title.toLowerCase().includes(term) || 
          material.type.toLowerCase().includes(term)
        )
      });
      
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalResults = filteredResults.lessons.length + filteredResults.students.length + filteredResults.materials.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Search size={20} className="text-slate-400" />
            <Input
              ref={inputRef}
              placeholder="Darslar, talabalar, materiallarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 shadow-none focus:ring-0 text-lg"
            />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Qidirilmoqda...</p>
            </div>
          ) : searchTerm.trim() === "" ? (
            <div className="p-8 text-center">
              <Search size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Qidirish uchun matn kiriting</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center">
              <Search size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">Hech nima topilmadi</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Boshqa kalit so'zlar bilan urinib ko'ring</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Lessons Results */}
              {filteredResults.lessons.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-slate-900 dark:text-white mb-3">
                    <BookOpen size={18} className="text-[#F5A623]" />
                    Darslar ({filteredResults.lessons.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-[#F5A623] transition-colors">
                            {lesson.title}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.topic}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400">{lesson.students} talaba</span>
                            <Badge 
                              color={lesson.status === "active" ? "jade" : lesson.status === "preparing" ? "saffron" : "gray"}
                              size="sm"
                            >
                              {lesson.status === "active" && "Faol"}
                              {lesson.status === "preparing" && "Tayyorlanmoqda"}
                              {lesson.status === "completed" && "Tugatilgan"}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-[#F5A623] transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students Results */}
              {filteredResults.students.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-slate-900 dark:text-white mb-3">
                    <Users size={18} className="text-blue-600" />
                    Talabalar ({filteredResults.students.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar 
                            initials={student.avatar} 
                            status={student.status === "active" ? "online" : "offline"}
                            size="sm"
                          />
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {student.name}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{student.progress}%</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials Results */}
              {filteredResults.materials.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-slate-900 dark:text-white mb-3">
                    <FileText size={18} className="text-purple-600" />
                    Materiallar ({filteredResults.materials.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                            {material.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge color="amethyst" size="sm">{material.type}</Badge>
                            <span className="text-xs text-slate-400">{material.size}</span>
                            <span className="text-xs text-slate-400">{material.lessons} dars</span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalResults > 0 && `${totalResults} ta natija topildi`}
            </p>
            <div className="text-xs text-slate-400">
              <kbd className="px-2 py-1 bg-white dark:bg-black rounded">Esc</kbd> yopish uchun
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
