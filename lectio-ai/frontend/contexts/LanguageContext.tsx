"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "uz" | "ru" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isUZ: boolean;
  isRU: boolean;
  isEN: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  uz: {
    // Navigation
    "nav.home": "Bosh sahifa",
    "nav.lessons": "Darslar",
    "nav.quizzes": "Testlar",
    "nav.analytics": "Tahlillar",
    "nav.settings": "Sozlamalar",
    "nav.profile": "Profil",
    "nav.logout": "Chiqish",
    
    // Auth
    "auth.login": "Kirish",
    "auth.register": "Ro'yxatdan o'tish",
    "auth.email": "Email",
    "auth.password": "Parol",
    "auth.forgot_password": "Parolni unutdingizmi?",
    "auth.no_account": "Akkauntingiz yo'qmi?",
    "auth.has_account": "Akkauntingiz bormi?",
    "auth.name": "Ism",
    "auth.role": "Rol",
    "auth.student": "Talaba",
    "auth.professor": "Professor",
    
    // Lessons
    "lesson.create": "Dars yaratish",
    "lesson.join": "Darsga qo'shilish",
    "lesson.code": "Dars kodi",
    "lesson.active": "Faol darslar",
    "lesson.completed": "Tugallangan darslar",
    "lesson.start": "Boshlash",
    "lesson.pause": "Pauza",
    "lesson.resume": "Davom etish",
    "lesson.end": "Yakunlash",
    "lesson.title": "Dars nomi",
    "lesson.description": "Tavsif",
    "lesson.subject": "Fan",
    "lesson.students_count": "Talabalar soni",
    
    // Camera
    "camera.enable": "Kamerani yoqish",
    "camera.disable": "Kamerani o'chirish",
    "camera.attention": "Diqqat",
    "camera.students_detected": "Aniqlangan talabalar",
    "camera.snapshot": "Snapshot",
    
    // Common
    "common.save": "Saqlash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O'chirish",
    "common.edit": "Tahrirlash",
    "common.close": "Yopish",
    "common.loading": "Yuklanmoqda...",
    "common.search": "Qidirish",
    "common.filter": "Filtrlash",
    "common.sort": "Saralash",
    "common.apply": "Qo'llash",
    "common.reset": "Qayta o'rnatish",
    "common.confirm": "Tasdiqlash",
    "common.back": "Orqaga",
    "common.next": "Keyingi",
    "common.submit": "Yuborish",
    "common.success": "Muvaffaqiyatli",
    "common.error": "Xato",
    "common.warning": "Ogohlantirish",
    "common.info": "Ma'lumot",
    
    // Theme
    "theme.dark": "Tungi rejim",
    "theme.light": "Kunduzgi rejim",
    "theme.system": "Tizim",
    "theme.title": "Mavzu",
    
    // Language
    "language.title": "Til",
    "language.uz": "O'zbek",
    "language.ru": "Rus",
    "language.en": "English",
  },
  ru: {
    // Navigation
    "nav.home": "Главная",
    "nav.lessons": "Уроки",
    "nav.quizzes": "Тесты",
    "nav.analytics": "Аналитика",
    "nav.settings": "Настройки",
    "nav.profile": "Профиль",
    "nav.logout": "Выход",
    
    // Auth
    "auth.login": "Вход",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.forgot_password": "Забыли пароль?",
    "auth.no_account": "Нет аккаунта?",
    "auth.has_account": "Есть аккаунт?",
    "auth.name": "Имя",
    "auth.role": "Роль",
    "auth.student": "Студент",
    "auth.professor": "Преподаватель",
    
    // Lessons
    "lesson.create": "Создать урок",
    "lesson.join": "Присоединиться",
    "lesson.code": "Код урока",
    "lesson.active": "Активные уроки",
    "lesson.completed": "Завершенные уроки",
    "lesson.start": "Начать",
    "lesson.pause": "Пауза",
    "lesson.resume": "Продолжить",
    "lesson.end": "Завершить",
    "lesson.title": "Название урока",
    "lesson.description": "Описание",
    "lesson.subject": "Предмет",
    "lesson.students_count": "Количество студентов",
    
    // Camera
    "camera.enable": "Включить камеру",
    "camera.disable": "Выключить камеру",
    "camera.attention": "Внимание",
    "camera.students_detected": "Обнаружено студентов",
    "camera.snapshot": "Снимок",
    
    // Common
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.close": "Закрыть",
    "common.loading": "Загрузка...",
    "common.search": "Поиск",
    "common.filter": "Фильтр",
    "common.sort": "Сортировка",
    "common.apply": "Применить",
    "common.reset": "Сбросить",
    "common.confirm": "Подтвердить",
    "common.back": "Назад",
    "common.next": "Далее",
    "common.submit": "Отправить",
    "common.success": "Успешно",
    "common.error": "Ошибка",
    "common.warning": "Предупреждение",
    "common.info": "Информация",
    
    // Theme
    "theme.dark": "Темная тема",
    "theme.light": "Светлая тема",
    "theme.system": "Системная",
    "theme.title": "Тема",
    
    // Language
    "language.title": "Язык",
    "language.uz": "Узбекский",
    "language.ru": "Русский",
    "language.en": "English",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.lessons": "Lessons",
    "nav.quizzes": "Quizzes",
    "nav.analytics": "Analytics",
    "nav.settings": "Settings",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    
    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot_password": "Forgot password?",
    "auth.no_account": "Don't have an account?",
    "auth.has_account": "Already have an account?",
    "auth.name": "Name",
    "auth.role": "Role",
    "auth.student": "Student",
    "auth.professor": "Professor",
    
    // Lessons
    "lesson.create": "Create Lesson",
    "lesson.join": "Join Lesson",
    "lesson.code": "Lesson Code",
    "lesson.active": "Active Lessons",
    "lesson.completed": "Completed Lessons",
    "lesson.start": "Start",
    "lesson.pause": "Pause",
    "lesson.resume": "Resume",
    "lesson.end": "End",
    "lesson.title": "Lesson Title",
    "lesson.description": "Description",
    "lesson.subject": "Subject",
    "lesson.students_count": "Students Count",
    
    // Camera
    "camera.enable": "Enable Camera",
    "camera.disable": "Disable Camera",
    "camera.attention": "Attention",
    "camera.students_detected": "Students Detected",
    "camera.snapshot": "Snapshot",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.apply": "Apply",
    "common.reset": "Reset",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.success": "Success",
    "common.error": "Error",
    "common.warning": "Warning",
    "common.info": "Info",
    
    // Theme
    "theme.dark": "Dark Mode",
    "theme.light": "Light Mode",
    "theme.system": "System",
    "theme.title": "Theme",
    
    // Language
    "language.title": "Language",
    "language.uz": "Uzbek",
    "language.ru": "Russian",
    "language.en": "English",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
}

export function LanguageProvider({
  children,
  defaultLanguage = "uz",
  storageKey = "lectio-language",
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Initialize language from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Language | null;
    if (stored && translations[stored]) {
      setLanguageState(stored);
    } else {
      setLanguageState(defaultLanguage);
    }
    setMounted(true);
  }, [defaultLanguage, storageKey]);

  // Update HTML lang attribute
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language;
  }, [language, mounted]);

  // Set language and persist to localStorage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem(storageKey, newLanguage);
  };

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isUZ: language === "uz",
        isRU: language === "ru",
        isEN: language === "en",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { LanguageContextType };
