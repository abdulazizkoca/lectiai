"use client";

import React from "react";
import { ShoppingBag, Star, Download, TrendingUp, Search, Tag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Sidebar } from "@/components/professor/Sidebar";
import { Header } from "@/components/professor/Header";

// Mock Data
const MARKETPLACE_ITEMS = [
  {
    id: 1,
    title: "To'liq Fizika kursi (1-semestr)",
    professor: "Prof. R. Tursunov",
    uni: "O'zMU",
    price: 50000,
    rating: 4.9,
    reviews: 120,
    tags: ["Prezentatsiyalar", "Testlar", "Flashcards"],
    color: "lapis"
  },
  {
    id: 2,
    title: "Tarix: Amir Temur davri",
    professor: "Docent M. Karimov",
    uni: "TDShU",
    price: 0,
    rating: 4.7,
    reviews: 345,
    tags: ["Interaktiv Ssenariy", "Testlar"],
    color: "saffron"
  },
  {
    id: 3,
    title: "Dasturlash Asoslari (Python)",
    professor: "A. G'ofurov",
    uni: "TATU",
    price: 15000,
    rating: 4.8,
    reviews: 89,
    tags: ["Amaliy mashg'ulotlar", "Quiz"],
    color: "jade"
  }
];

export default function ProfessorMarketplace() {
  return (
    <div className="flex h-[100dvh] bg-[#FAFAF7] dark:bg-[#0C0C14] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header onOpenSearch={() => {}} onOpenNotifications={() => {}} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#7B2FBE] to-[#1B4FD8] rounded-3xl p-8 text-white shadow-xl">
              <div>
                <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                  <ShoppingBag /> O'qituvchilar Markazi
                </h1>
                <p className="mt-2 text-white/80 max-w-xl">
                  Eng yaxshi professorlar yaratgan sifatli dars materiallarini kashf eting yoki o'z materiallaringizni sotib daromad qiling.
                </p>
              </div>
              <div className="flex gap-3 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="text-center px-4 border-r border-white/20">
                  <p className="text-xs uppercase font-bold text-white/60">Daromadingiz</p>
                  <p className="text-xl font-bold font-mono text-[#F5A623]">125,000 UZS</p>
                </div>
                <Button variant="primary" size="sm" className="shadow-none">Yangi Material Qo'shish</Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="w-96"><Input label="Material qidirish..." leftIcon={<Search size={18} />} inputSize="md" /></div>
              <Button variant="secondary">Fanlar</Button>
              <Button variant="secondary">Universitetlar</Button>
              <Button variant="ghost" className="text-slate-500">Filtrlarni tozalash</Button>
            </div>

            {/* Top Categories & Trending */}
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-[#F5A623]" />
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Ommabop Materiallar</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MARKETPLACE_ITEMS.map(item => (
                <Card key={item.id} accentColor={item.color as any} isInteractive className="flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge color={item.price === 0 ? "jade" : "amethyst"} variant="solid">
                      {item.price === 0 ? "Bepul" : `${item.price.toLocaleString()} UZS`}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <Star size={16} className="text-[#F5A623] fill-current" /> {item.rating} <span className="text-slate-500 font-normal">({item.reviews})</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 font-bold mb-4">{item.professor} • {item.uni}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded flex items-center gap-1">
                        <Tag size={12} /> {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex gap-2">
                    <Button variant="secondary" className="flex-1">Ko'rish</Button>
                    <Button variant={item.price === 0 ? "ghost" : "primary"} className="flex-1" leftIcon={<Download size={16} />}>
                      {item.price === 0 ? "Yuklash" : "Sotib olish"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
