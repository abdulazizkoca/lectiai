"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home, BookOpen, FolderOpen, PlusCircle, Radio, Video,
  BarChart2, Users, Settings, ChevronLeft, ChevronRight, Crown
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const dict = {
  uz: {
    dashboard: "Dashboard",
    myLessons: "Mening darslarim",
    materials: "Metodichkalar",
    createLesson: "Dars yaratish",
    liveLesson: "Jonli Dars",
    analytics: "Analitika",
    students: "Talabalar",
    settings: "Sozlamalar",
    mainMenu: "Asosiy menyu",
    management: "Boshqaruv",
    goPremium: "Premiumga o'tish",
    basicPlan: "Asosiy reja",
    hideMenu: "Yon menyuni yashirish yoki ko'rsatish"
  },
  ru: {
    dashboard: "Дашборд",
    myLessons: "Мои уроки",
    materials: "Методички",
    createLesson: "Создать урок",
    liveLesson: "Живой урок",
    analytics: "Аналитика",
    students: "Студенты",
    settings: "Настройки",
    mainMenu: "Главное меню",
    management: "Управление",
    goPremium: "Перейти на Premium",
    basicPlan: "Базовый план",
    hideMenu: "Скрыть или показать боковое меню"
  },
  en: {
    dashboard: "Dashboard",
    myLessons: "My Lessons",
    materials: "Materials",
    createLesson: "Create Lesson",
    liveLesson: "Live Lesson",
    analytics: "Analytics",
    students: "Students",
    settings: "Settings",
    mainMenu: "Main Menu",
    management: "Management",
    goPremium: "Go Premium",
    basicPlan: "Basic Plan",
    hideMenu: "Hide or show sidebar"
  }
};

export function Sidebar({ isMobileOpen, onCloseMobile }: { isMobileOpen?: boolean, onCloseMobile?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("Professor");
  const [userInitials, setUserInitials] = useState("P");
  const pathname = usePathname();
  const { language } = useLanguage();
  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("lectio_user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.full_name) {
          setUserName(user.full_name);
          setUserInitials(user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase());
        }
      }
    } catch {}
  }, []);

  const navItems = [
    { name: t.dashboard, href: "/professor/dashboard", icon: <Home size={20} /> },
    { name: t.myLessons, href: "/professor/lessons", icon: <BookOpen size={20} /> },
    { name: t.materials, href: "/professor/materials", icon: <FolderOpen size={20} /> },
    { name: t.createLesson, href: "/professor/create-lesson", icon: <PlusCircle size={20} className="text-[#F5A623]" />, highlight: true },
    { name: t.liveLesson, href: "/professor/live", icon: <Video size={20} />, live: true },
    { name: t.analytics, href: "/professor/analytics", icon: <BarChart2 size={20} /> },
    { name: t.students, href: "/professor/students", icon: <Users size={20} /> },
    { name: t.settings, href: "/professor/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
          onClick={onCloseMobile}
        />
      )}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 260 }}
        className={`fixed inset-y-0 left-0 md:sticky md:top-0 h-[100dvh] shrink-0 bg-white/80 dark:bg-black/45 backdrop-blur-md border-r border-black/5 dark:border-white/5 flex flex-col transition-transform duration-300 z-[60] md:z-20 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-white hover:bg-[#F5A623] hover:text-black transition-colors z-50 shadow-sm"
        aria-label={t.hideMenu}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'px-6'} shrink-0`}>
        <Link href="/" className="flex items-center gap-3 group">
          <Logo
            size={34}
            className="shrink-0 transition-transform duration-300 group-hover:scale-110"
          />
          {!collapsed && (
            <span className="font-display font-bold text-xl tracking-wide text-slate-900 dark:text-white group-hover:text-[#F5A623] transition-colors">
              Lectio AI
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
        {!collapsed && <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">{t.mainMenu}</div>}
        
        {navItems.map((item, idx) => {
          if (idx === 5 && !collapsed) return (
            <React.Fragment key={item.name}>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-3" />
              <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.management}</div>
              <NavItem item={item} collapsed={collapsed} isActive={pathname === item.href} />
            </React.Fragment>
          );
          return <NavItem key={item.name} item={item} collapsed={collapsed} isActive={pathname === item.href} />;
        })}
        
        <div className="mt-auto pt-4">
          <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-3" />
          <Link href="/professor/upgrade" className={`flex items-center px-3 py-3 rounded-xl transition-colors hover:bg-[#7B2FBE]/10 text-slate-500 dark:text-slate-300 hover:text-[#7B2FBE] ${collapsed ? 'justify-center' : ''}`}>
            <Crown size={20} className="shrink-0 text-[#7B2FBE]" />
            {!collapsed && <span className="ml-3 font-bold text-sm">{t.goPremium}</span>}
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/professor/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
          <Avatar initials={userInitials} size="sm" status="online" className="shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#F5A623] transition-colors">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{t.basicPlan}</p>
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
    </>
  );
}

function NavItem({ item, collapsed, isActive }: { item: any, collapsed: boolean, isActive: boolean }) {
  return (
    <Link href={item.href} className="relative group block">
      {isActive && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 top-0 bottom-0 w-1 bg-[#F5A623] rounded-r-full" 
        />
      )}
      <div className={`
        flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}
        ${item.highlight ? 'text-[#F5A623] hover:text-[#F5A623] hover:bg-[#F5A623]/10' : ''}
        ${collapsed ? 'justify-center' : ''}
      `}>
        <div className="shrink-0 relative">
          {item.icon}
          {item.live && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E84855] rounded-full animate-pulse" />}
        </div>
        
        {!collapsed && (
          <div className="ml-3 flex-1 flex items-center justify-between">
            <span className="font-bold text-sm">{item.name}</span>
            {item.badge && <Badge color="gray" size="sm" className="ml-2">{item.badge}</Badge>}
          </div>
        )}
      </div>
      
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-white dark:bg-[#18181F] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl font-bold flex items-center gap-2">
          {item.name}
          {item.badge && <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{item.badge}</span>}
          {item.live && <span className="w-1.5 h-1.5 bg-[#E84855] rounded-full animate-pulse" />}
        </div>
      )}
    </Link>
  );
}
