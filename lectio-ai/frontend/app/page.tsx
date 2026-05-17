"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Globe,
  GraduationCap,
  Moon,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { Language, useLanguage } from "@/contexts/LanguageContext";

function HomeNav() {
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage } = useLanguage();

  const langs: { code: Language; label: string }[] = [
    { code: "uz", label: "UZ" },
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: isDark ? "rgba(10,10,15,0.7)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
      }}
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <Logo
          size={36}
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <span className="font-bold text-xl tracking-tight" style={{ color: isDark ? "#fff" : "#0A0A0F" }}>
          Lectio <span className="text-[#F5A623]">AI</span>
        </span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 sm:gap-3"
      >
        <div
          className="flex items-center gap-1 rounded-xl p-1 shadow-sm"
          style={{ 
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
          }}
        >
          <Globe size={14} style={{ color: isDark ? "#888" : "#666", marginLeft: 6, marginRight: 2 }} />
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
              style={{
                background: language === l.code ? "#F5A623" : "transparent",
                color: language === l.code ? "#000" : isDark ? "#888" : "#666",
                boxShadow: language === l.code ? "0 2px 8px rgba(245,166,35,0.3)" : "none"
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
            color: isDark ? "#F5A623" : "#1B4FD8",
          }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </motion.div>
    </nav>
  );
}

const CARDS = [
  {
    id: "professor",
    Icon: GraduationCap,
    title: { uz: "O'qituvchi", ru: "Преподаватель", en: "Professor" },
    subtitle: {
      uz: "Darsni boshqaring, o'quvchilarni kuzating",
      ru: "Управляйте уроком, следите за студентами",
      en: "Manage lessons, track students",
    },
    badge: { uz: "AI + Kamera", ru: "AI + Камера", en: "AI + Camera" },
    route: "/professor/dashboard",
    gradient: "linear-gradient(135deg, #1B4FD8 0%, #0F2980 100%)",
    glow: "rgba(27,79,216,0.5)",
    accent: "#4F87FF",
    featured: false,
  },
  {
    id: "quiz",
    Icon: Zap,
    title: { uz: "Quiz", ru: "Quiz", en: "Quiz" },
    subtitle: {
      uz: "Qiziqarli test - istalgan vaqt",
      ru: "Тест - в любое время",
      en: "Fun quiz - anytime",
    },
    badge: { uz: "Live & Solo", ru: "Live и Solo", en: "Live & Solo" },
    route: "/join",
    gradient: "linear-gradient(135deg, #F5A623 0%, #C97B0F 100%)",
    glow: "rgba(245,166,35,0.5)",
    accent: "#FFD166",
    featured: true, // Mark central card as featured
  },
  {
    id: "student",
    Icon: BookOpen,
    title: { uz: "O'quvchi", ru: "Студент", en: "Student" },
    subtitle: {
      uz: "O'rgan, qatnash, rivojlan",
      ru: "Учись, участвуй, развивайся",
      en: "Learn, participate, grow",
    },
    badge: { uz: "Mustaqil + Dars", ru: "Самостоятельно + Урок", en: "Solo + Lesson" },
    route: "/student/dashboard",
    gradient: "linear-gradient(135deg, #0D9373 0%, #066B52 100%)",
    glow: "rgba(13,147,115,0.5)",
    accent: "#2DD4A1",
    featured: false,
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { language } = useLanguage();

  const lang = language as "uz" | "ru" | "en";

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500"
      style={{ background: isDark ? "#050508" : "#F8FAFC" }}
    >
      <HomeNav />

      {/* Cinematic Ambient Background with Image */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Abstract Tech/Education Background Image using next/image for optimization */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: isDark ? 0.4 : 0.15,
            mixBlendMode: isDark ? "screen" : "multiply",
          }}
        >
          <Image 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853"
            alt="Education Background"
            fill
            priority
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
        </div>
        
        {/* Overlay to ensure text remains readable */}
        <div className="absolute inset-0" style={{ background: isDark ? "linear-gradient(to bottom, rgba(5,5,8,0.3), #050508)" : "linear-gradient(to bottom, rgba(248,250,252,0.5), #F8FAFC)" }} />

        {/* Floating Gradient Orbs - Optimized for mobile by reducing blur and size on small screens */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full opacity-[0.05] md:opacity-[0.07] blur-[60px] md:blur-[120px]"
          style={{ background: "#F5A623", animation: "float 20s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] rounded-full opacity-[0.04] md:opacity-[0.05] blur-[60px] md:blur-[120px]"
          style={{ background: "#1B4FD8", animation: "float 25s ease-in-out infinite reverse" }}
        />
        <div
          className="hidden md:block absolute top-[35%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: "#0D9373", animation: "float 22s ease-in-out infinite 2s" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 md:px-6 pt-24 md:pt-32 pb-16 md:pb-24 relative z-10 w-full mx-auto gap-16 md:gap-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center relative px-2 md:px-0"
        >
          {/* Glassy badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold mb-8 shadow-lg backdrop-blur-md"
            style={{
              background: isDark ? "rgba(245,166,35,0.08)" : "rgba(245,166,35,0.12)",
              color: "#F5A623",
              border: "1px solid rgba(245,166,35,0.3)",
            }}
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>AI-powered learning platform</span>
          </motion.div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 tracking-tight relative"
            style={{ color: isDark ? "#fff" : "#0A0A0F", lineHeight: 1.05 }}
          >
            Lectio <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#FFD166] drop-shadow-lg">AI</span>
          </h1>
          
          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto font-medium leading-relaxed relative"
            style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}
          >
            {lang === "uz" &&
              "O'zbek ta'limida yangi davr. Darslikdan testgacha - barchasi AI bilan intellektual darajada."}
            {lang === "ru" &&
              "Новая эра в образовании Узбекистана. От учебника до теста - всё на интеллектуальном уровне с AI."}
            {lang === "en" &&
              "A new era in Uzbek education. From textbooks to tests - all intelligently powered by AI."}
          </p>
        </motion.div>

        {/* Responsive Grid instead of fixed columns */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 px-4 relative z-20">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push(card.route)}
              className={`relative cursor-pointer rounded-[1.5rem] md:rounded-[1.75rem] overflow-hidden group p-6 md:p-7 lg:p-8 min-h-[260px] md:min-h-[290px] ${card.featured ? 'md:min-h-[310px] md:-translate-y-3 lg:-translate-y-5' : ''}`}
              style={{
                background: card.gradient,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: `0 10px 30px rgba(0,0,0,0.1)`,
                zIndex: card.featured ? 30 : 20
              }}
              whileHover={{ 
                scale: 1.02, 
                y: card.featured ? -20 : -8, 
                boxShadow: `0 25px 50px ${card.glow}`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Subtle inner grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                  backgroundSize: "28px 28px",
                }}
              />

              {/* Hover Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen"
                style={{ background: `radial-gradient(circle at 50% 0%, ${card.accent}30, transparent 70%)` }}
              />

              {/* Glassy Badge */}
              <div className="self-start px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm z-10 transition-transform group-hover:scale-105"
                   style={{ 
                     background: "rgba(255,255,255,0.15)", 
                     backdropFilter: "blur(12px)",
                     WebkitBackdropFilter: "blur(12px)",
                     border: "1px solid rgba(255,255,255,0.2)"
                   }}>
                {card.badge[lang]}
              </div>

              <div className="z-10 mt-6 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-inner"
                     style={{ 
                       background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                       border: "1px solid rgba(255,255,255,0.2)",
                       backdropFilter: "blur(10px)"
                     }}>
                  <card.Icon size={28} className="text-white drop-shadow-md" />
                </div>
              </div>

              <div className="z-10 flex-1 flex flex-col justify-end">
                <h2 className="font-black text-white mb-2 text-xl lg:text-2xl tracking-tight drop-shadow-sm">
                  {card.title[lang]}
                </h2>
                <p className="text-white/80 text-sm font-medium mb-5 leading-snug">
                  {card.subtitle[lang]}
                </p>
                <div className="flex items-center gap-2 text-white text-sm font-bold group-hover:gap-3 transition-all mt-auto bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 group-hover:bg-white/20">
                  <span>{lang === "uz" ? "Kirish" : lang === "ru" ? "Войти" : "Enter"}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 flex flex-col items-center gap-2 relative z-10"
        >
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-slate-500 to-transparent mb-2" />
          <p className="text-xs font-medium tracking-wider uppercase" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
            © 2026 Lectio AI — Future of Education
          </p>
        </motion.div>
      </div>
    </main>
  );
}
