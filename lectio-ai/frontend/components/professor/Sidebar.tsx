"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Home, BookOpen, FolderOpen, PlusCircle, Radio, 
  BarChart2, Users, Settings, ChevronLeft, ChevronRight, Crown
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/professor/dashboard", icon: <Home size={20} /> },
    { name: "Mening darslarim", href: "/professor/lessons", icon: <BookOpen size={20} />, badge: "12" },
    { name: "Materiallar", href: "/professor/materials", icon: <FolderOpen size={20} /> },
    { name: "Dars yaratish", href: "/professor/create-lesson", icon: <PlusCircle size={20} className="text-[#F5A623]" />, highlight: true },
    { name: "Jonli Quiz", href: "/professor/live", icon: <Radio size={20} />, live: true },
    { name: "Analitika", href: "/professor/analytics", icon: <BarChart2 size={20} /> },
    { name: "Talabalar", href: "/professor/students", icon: <Users size={20} /> },
    { name: "Sozlamalar", href: "/professor/settings", icon: <Settings size={20} /> },
  ];

  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen shrink-0 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col relative transition-all duration-300 z-40"
    >
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-[#F5A623] hover:text-black transition-colors z-50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'px-6'} shrink-0`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#e8941a] flex items-center justify-center font-display font-bold text-black shrink-0 shadow-lg shadow-[#F5A623]/20">
          L
        </div>
        {!collapsed && <span className="ml-3 font-display font-bold text-xl tracking-wide text-white">Lectio AI</span>}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
        {!collapsed && <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Asosiy menyu</div>}
        
        {navItems.map((item, idx) => {
          if (idx === 5 && !collapsed) return (
            <React.Fragment key={item.name}>
              <div className="h-px bg-slate-800 my-4 mx-3" />
              <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Boshqaruv</div>
              <NavItem item={item} collapsed={collapsed} isActive={pathname === item.href} />
            </React.Fragment>
          );
          return <NavItem key={item.name} item={item} collapsed={collapsed} isActive={pathname === item.href} />;
        })}
        
        <div className="mt-auto pt-4">
          <div className="h-px bg-slate-800 my-4 mx-3" />
          <Link href="/professor/upgrade" className={`flex items-center px-3 py-3 rounded-xl transition-colors hover:bg-[#7B2FBE]/10 text-slate-300 hover:text-[#7B2FBE] ${collapsed ? 'justify-center' : ''}`}>
            <Crown size={20} className="shrink-0 text-[#7B2FBE]" />
            {!collapsed && <span className="ml-3 font-bold text-sm">Premiumga o'tish</span>}
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <Link href="/professor/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <Avatar initials="JD" size="sm" status="online" className="shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#F5A623] transition-colors">Prof. J. Doe</p>
              <p className="text-xs text-slate-500 truncate">Asosiy reja</p>
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
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
        ${isActive ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
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
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-[#18181F] border border-slate-700 text-white text-xs px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl font-bold flex items-center gap-2">
          {item.name}
          {item.badge && <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{item.badge}</span>}
          {item.live && <span className="w-1.5 h-1.5 bg-[#E84855] rounded-full animate-pulse" />}
        </div>
      )}
    </Link>
  );
}
