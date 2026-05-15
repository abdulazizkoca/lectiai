"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Clock, 
  Users, 
  Download, 
  Share2, 
  CheckCircle,
  Brain,
  Lightbulb,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface LessonSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: {
    title: string;
    duration: number;
    topics: string[];
    keyPoints: string[];
    quizResults?: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
    };
    notes?: string[];
    reactions?: Record<string, number>;
  };
}

export function LessonSummary({ isOpen, onClose, lessonData }: LessonSummaryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (isOpen && lessonData) {
      generateSummary();
    }
  }, [isOpen, lessonData]);

  const generateSummary = async () => {
    setIsGenerating(true);
    
    // Simulate AI summary generation
    setTimeout(() => {
      const generatedSummary = {
        overview: `${lessonData.title} darsi muvaffaqiyatli yakunlandi. Dars davomida ${lessonData.topics.length} ta asosiy mavzu o'rganildi.`,
        keyConcepts: lessonData.keyPoints.map((point, index) => ({
          id: index + 1,
          concept: point,
          importance: Math.random() > 0.5 ? "high" : "medium",
          explanation: `Bu tushuncha ${lessonData.title} ning asosiy qismlaridan biri bo'lib, chuqur tushunish muhim.`
        })),
        recommendations: [
          "Mavzuni takrorlash uchun flashcards dan foydalaning",
          "Amaliy mashqlar bilan mustahkamlang",
          "Qo'shimcha manbalarni o'rganing",
          "Boshqa talabalar bilan muhokama qiling"
        ],
        nextSteps: [
          `${lessonData.topics[0]} bo'yicha chuqurroq o'rganish`,
          "Amaliy loyiha qilish",
          "Test topshirish",
          "Ustozdan qo'shimcha maslahat olish"
        ],
        resources: [
          { type: "video", title: "Video darslik", url: "#" },
          { type: "article", title: "Maqola", url: "#" },
          { type: "quiz", title: "Qo'shimcha test", url: "#" }
        ]
      };
      
      setSummary(generatedSummary);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownload = () => {
    // Create downloadable summary
    const summaryText = `
DARS XULOSASI
================

Dars: ${lessonData.title}
Davomiyligi: ${lessonData.duration} daqiqa

ASOSIY MAVZULAR:
${lessonData.topics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

MUHIM NUKTALAR:
${lessonData.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

TEST NATIJALARI:
${lessonData.quizResults ? `Ball: ${lessonData.quizResults.score}/${lessonData.quizResults.totalQuestions} (${Math.round((lessonData.quizResults.correctAnswers / lessonData.quizResults.totalQuestions) * 100)}%)` : 'Test topshirilmagan'}

TAVSIYALAR:
${summary?.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

KEYINGI QADAMLAR:
${summary?.nextSteps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
    `;
    
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonData.title}_xulosa.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: `${lessonData.title} - Dars xulosasi`,
        text: summary?.overview || "Dars muvaffaqiyatli yakunlandi!",
        url: window.location.href
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#18181F] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F5A623] to-[#e8941a] rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Dars Xulosasi</h2>
              <p className="text-slate-400">{lessonData.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isGenerating ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">AI xulosa tayyorlanmoqda...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#F5A623] mb-3 flex items-center gap-2">
                  <Star size={20} />
                  Umumiy ko'rik
                </h3>
                <p className="text-slate-300 leading-relaxed">{summary.overview}</p>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <Clock className="mx-auto mb-2 text-[#1B4FD8]" size={24} />
                  <p className="text-2xl font-bold">{lessonData.duration}</p>
                  <p className="text-sm text-slate-400">daqiqa</p>
                </Card>
                <Card className="p-4 text-center">
                  <BookOpen className="mx-auto mb-2 text-[#0D9373]" size={24} />
                  <p className="text-2xl font-bold">{lessonData.topics.length}</p>
                  <p className="text-sm text-slate-400">mavzu</p>
                </Card>
                <Card className="p-4 text-center">
                  <Target className="mx-auto mb-2 text-[#F5A623]" size={24} />
                  <p className="text-2xl font-bold">{lessonData.keyPoints.length}</p>
                  <p className="text-sm text-slate-400">nuqta</p>
                </Card>
                {lessonData.quizResults && (
                  <Card className="p-4 text-center">
                    <Trophy className="mx-auto mb-2 text-[#E84855]" size={24} />
                    <p className="text-2xl font-bold">{Math.round((lessonData.quizResults.correctAnswers / lessonData.quizResults.totalQuestions) * 100)}%</p>
                    <p className="text-sm text-slate-400">to'g'ri</p>
                  </Card>
                )}
              </div>

              {/* Key Concepts */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#1B4FD8] mb-4 flex items-center gap-2">
                  <Brain size={20} />
                  Asosiy tushunchalar
                </h3>
                <div className="space-y-3">
                  {summary.keyConcepts.map((concept: any) => (
                    <div key={concept.id} className="flex items-start gap-3">
                      <CheckCircle className="text-[#0D9373] mt-1" size={16} />
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{concept.concept}</h4>
                        <p className="text-sm text-slate-400">{concept.explanation}</p>
                        <Badge 
                          color={concept.importance === "high" ? "saffron" : "lapis"} 
                          size="sm"
                          className="mt-2"
                        >
                          {concept.importance === "high" ? "Muhim" : "O'rtacha"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#0D9373] mb-4 flex items-center gap-2">
                  <Lightbulb size={20} />
                  Tavsiyalar
                </h3>
                <div className="space-y-2">
                  {summary.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-[#F5A623]">•</span>
                      <span className="text-slate-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Next Steps */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-purple-500 mb-4">Keyingi qadamlar</h3>
                <div className="space-y-2">
                  {summary.nextSteps.map((step: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-purple-500">{index + 1}.</span>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resources */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-[#EC4899] mb-4">Qo'shimcha resurslar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {summary.resources.map((resource: any, index: number) => (
                    <Button key={index} variant="secondary" className="justify-start">
                      {resource.type === "video" && "🎥"}
                      {resource.type === "article" && "📄"}
                      {resource.type === "quiz" && "📝"}
                      {resource.title}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-700 flex gap-4">
          <Button variant="primary" onClick={handleDownload} className="flex-1">
            <Download size={18} className="mr-2" />
            Yuklab olish
          </Button>
          <Button variant="secondary" onClick={handleShare}>
            <Share2 size={18} className="mr-2" />
            Ulashish
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
