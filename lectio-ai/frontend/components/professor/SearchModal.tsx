"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, BookOpen, Users, FileText, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for search
const mockData = {
  lessons: [
    { id: 1, title: "Algebra asoslari", subject: "Matematika", students: 25, progress: 80, date: "2 kun oldin" },
    { id: 2, title: "Fizika qonunlari", subject: "Fizika", students: 18, progress: 60, date: "1 hafta oldin" },
    { id: 3, title: "Organik kimyo", subject: "Kimyo", students: 22, progress: 45, date: "3 kun oldin" }
  ],
  students: [
    { id: 1, name: "Ali Karimov", email: "ali@example.com", progress: 85, streak: 7, lastActive: "Bugun" },
    { id: 2, name: "Dilora Rahimova", email: "dilora@example.com", progress: 72, streak: 5, lastActive: "Kecha" },
    { id: 3, name: "Bobur Toshov", email: "bobur@example.com", progress: 93, streak: 12, lastActive: "2 kun oldin" }
  ],
  materials: [
    { id: 1, title: "Darslik PDF", type: "PDF", size: "2.4 MB", subject: "Matematika", uploadDate: "1 kun oldin" },
    { id: 2, title: "Video dars", type: "MP4", size: "125 MB", subject: "Fizika", uploadDate: "3 kun oldin" },
    { id: 3, title: "Test savollari", type: "DOCX", size: "156 KB", subject: "Kimyo", uploadDate: "1 hafta oldin" }
  ]
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<typeof mockData>({ lessons: [], students: [], materials: [] });

  useEffect(() => {
    if (isOpen) {
      // Reset search when modal opens
      setSearchTerm("");
      setResults(mockData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      
      // Simulate search delay
      const timer = setTimeout(() => {
        const filtered = {
          lessons: mockData.lessons.filter(lesson => 
            lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lesson.subject.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          students: mockData.students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          materials: mockData.materials.filter(material =>
            material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
        };
        
        setResults(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults(mockData);
      setIsLoading(false);
    }
  }, [searchTerm]);

  const handleItemClick = (type: string, id: number) => {
    void type;
    void id;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#FAFAF7] dark:bg-[#18181F] rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-black dark:text-white">Qidiruv</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Darslar, talabalar yoki materiallarni qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Lessons */}
                {results.lessons.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                      <BookOpen size={18} className="text-[#F5A623]" />
                      Darslar
                    </h3>
                    <div className="space-y-2">
                      {results.lessons.map((lesson) => (
                        <Card
                          key={lesson.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          onClick={() => handleItemClick('lesson', lesson.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-black dark:text-white">{lesson.title}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.subject}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.students} talaba</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{lesson.date}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-[#0D9373] h-2 rounded-full"
                                style={{ width: `${lesson.progress}%` }}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students */}
                {results.students.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                      <Users size={18} className="text-[#1B4FD8]" />
                      Talabalar
                    </h3>
                    <div className="space-y-2">
                      {results.students.map((student) => (
                        <Card
                          key={student.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          onClick={() => handleItemClick('student', student.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-black dark:text-white">{student.name}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{student.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">{student.progress}%</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{student.lastActive}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge color="saffron" size="sm">
                              🔥 {student.streak} kun
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials */}
                {results.materials.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-[#0D9373]" />
                      Materiallar
                    </h3>
                    <div className="space-y-2">
                      {results.materials.map((material) => (
                        <Card
                          key={material.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          onClick={() => handleItemClick('material', material.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-black dark:text-white">{material.title}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{material.subject}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">{material.size}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{material.uploadDate}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge color="lapis" size="sm">
                              {material.type}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results */}
                {!isLoading && results.lessons.length === 0 && results.students.length === 0 && results.materials.length === 0 && (
                  <div className="text-center py-8">
                    <Search size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400">Hech narsa topilmadi</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                      "{searchTerm}" bo'yicha natijalar yo'q
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
