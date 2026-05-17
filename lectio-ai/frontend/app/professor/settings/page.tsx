"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, User, Bell, Shield, Globe, Palette, HelpCircle, Save, 
  Mail, Phone, Camera, Brain, Link2, Check, Video, AlertTriangle, 
  Smartphone, Eye, Sliders, Server, MessageSquare, ArrowRight, Lock, Key, Monitor, Sun, Moon, X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const dict = {
  uz: {
    title: "Sozlamalar",
    subtitle: "Profilingiz, AI detektori va tizim sozlamalari",
    save: "Saqlash",
    saving: "Saqlanmoqda...",
    saved: "Saqlandi!",
    savedDesc: "O'zgartirishlar muvaffaqiyatli saqlandi",
    tabs: {
      profile: "Profil",
      ai: "AI Detektor",
      notifications: "Bildirishnomalar",
      security: "Xavfsizlik",
      preferences: "Mavzu & Til",
      integrations: "Integratsiyalar",
      help: "Yordam"
    },
    profileSection: {
      title: "Profil ma'lumotlari",
      avatarChange: "Rasmni o'zgartirish",
      avatarHint: "JPG, PNG maksimal 2MB",
      name: "Ism va familiya",
      email: "Email manzil",
      phone: "Telefon raqam",
      faculty: "Fakultet / Kafedra",
      bio: "Muallif haqida (Bio)",
      bioPlaceholder: "O'zingiz haqingizda qisqacha ma'lumot yozing..."
    },
    aiSection: {
      title: "AI Diqqat Kuzatuvi Sozlamalari",
      subtitle: "Dars paytida talabalar faolligini nazorat qiluvchi neyrotarmoq sozlamalari",
      sensitivity: "Detektor sezgirlik darajasi",
      sensLow: "Past",
      sensLowDesc: "Kamroq resurs sarflaydi",
      sensMed: "O'rta",
      sensMedDesc: "Tavsiya etilgan standart rejim",
      sensHigh: "Yuqori",
      sensHighDesc: "Maksimal aniqlik (resurs talab qiladi)",
      cameraSource: "Birlamchi veb-kamera",
      phoneTrack: "Telefon aniqlash algoritmi",
      phoneTrackDesc: "Talaba dars davomida telefondan foydalansa AI darhol qayd etadi",
      alertLow: "Diqqat pastligidan ogohlantirish",
      alertLowDesc: "O'rtacha diqqat 50% dan tushib ketganda ekranda maslahat ko'rsatish",
      timeout: "Chalg'ish vaqti chegarasi",
      timeoutDesc: "Talaba necha soniya boshqa tomonga qaraganda chalg'idi deb hisoblash",
      timeoutSec: "{sec} soniya"
    },
    notifSection: {
      title: "Bildirishnomalar sozlamalari",
      email: "Email bildirishnomalari",
      emailDesc: "Haftalik dars hisoboti va talabalar faolligi",
      push: "Push bildirishnomalari",
      pushDesc: "Muhim voqealar haqida brauzerda",
      studentAct: "Talabalar faolligi",
      studentActDesc: "Talabalar progressi va yangi natijalari",
      lessonRemind: "Dars eslatmalari",
      lessonRemindDesc: "Boshlanadigan jonli darslar oldidan ogohlantirish",
      marketing: "Tavsiyalar va yangiliklar",
      marketingDesc: "Yangi AI modellar va tizim yangilanishlari"
    },
    securitySection: {
      title: "Xavfsizlik sozlamalari",
      changePass: "Parolni o'zgartirish",
      currPass: "Joriy parol",
      newPass: "Yangi parol",
      confPass: "Yangi parolni tasdiqlang",
      changeBtn: "Parolni yangilash",
      twoFactor: "Ikki faktli autentifikatsiya (2FA)",
      twoFactorDesc: "Hisobingizni SMS yoki Authenticator ilovasi orqali himoyalash",
      active: "Faol",
      disabled: "Faol emas",
      setup2fa: "2FA Sozlash",
      sessions: "Faol sessiyalar",
      current: "Joriy",
      terminate: "Tugatish"
    },
    prefSection: {
      title: "Mavzu va Mintaqa sozlamalari",
      timezone: "Vaqt zonasi",
      theme: "Interfeys mavzusi",
      light: "Yorqin rejim",
      dark: "Qorong'u rejim",
      system: "Tizim rejimi",
      langSelect: "Tizim tili"
    },
    integrationsSection: {
      title: "Platforma Integratsiyalari",
      subtitle: "Lectio AI platformasini tashqi tizimlar va botlarga ulash",
      telegram: "Telegram bot xabarnomalari",
      telegramDesc: "Dars natijalari va tezkor statistikani to'g'ridan-to'g'ri Telegram'ga olish",
      telegramBtn: "Telegram orqali ulash",
      tgCode: "Sizning ulanish kodingiz:",
      lms: "LMS / Moodle integratsiyasi",
      lmsDesc: "Talabalar natijalari va baholarini avtomatik Moodle tizimiga yuborish",
      lmsUrl: "LMS Portal manzili (URL)",
      lmsToken: "LMS Integratsiya kaliti (API Token)",
      autoExport: "Excel hisobotlarni avtomatik yuborish",
      autoExportDesc: "Har bir dars yakunida to'liq Excel tahlilini profilingizga jo'natish"
    },
    helpSection: {
      title: "Yordam va qo'llab-quvvatlash",
      quick: "Tezkor yordam yo'llari",
      guide: "Foydalanuvchi qo'llanmasi",
      tech: "Texnik yordam",
      phoneHelp: "Telefon orqali yordam",
      videoHelp: "Video darslar",
      faq: "Tez-tez so'raladigan savollar"
    }
  },
  ru: {
    title: "Настройки",
    subtitle: "Ваш профиль, AI-детектор и системные настройки",
    save: "Сохранить",
    saving: "Сохранение...",
    saved: "Сохранено!",
    savedDesc: "Изменения успешно сохранены",
    tabs: {
      profile: "Профиль",
      ai: "AI Детектор",
      notifications: "Уведомления",
      security: "Безопасность",
      preferences: "Тема и Язык",
      integrations: "Интеграции",
      help: "Помощь"
    },
    profileSection: {
      title: "Профильные данные",
      avatarChange: "Изменить фото",
      avatarHint: "JPG, PNG максимум 2МБ",
      name: "Имя и фамилия",
      email: "Email адрес",
      phone: "Номер телефона",
      faculty: "Факультет / Кафедра",
      bio: "Биография",
      bioPlaceholder: "Напишите кратко о себе..."
    },
    aiSection: {
      title: "Настройки AI Детектора Внимания",
      subtitle: "Параметры нейросети, отслеживающей активность студентов",
      sensitivity: "Уровень чувствительности детектора",
      sensLow: "Низкий",
      sensLowDesc: "Потребляет меньше ресурсов",
      sensMed: "Средний",
      sensMedDesc: "Рекомендуемый стандартный режим",
      sensHigh: "Высокий",
      sensHighDesc: "Максимальная точность (требует ресурсов)",
      cameraSource: "Основная веб-камера",
      phoneTrack: "Алгоритм обнаружения телефона",
      phoneTrackDesc: "AI сразу зафиксирует, если студент использует телефон во время занятия",
      alertLow: "Предупреждение о низком внимании",
      alertLowDesc: "Показывать подсказки на экране, когда среднее внимание падает ниже 50%",
      timeout: "Лимит времени отвлечения",
      timeoutDesc: "Через сколько секунд отсутствия взгляда считать студента отвлекшимся",
      timeoutSec: "{sec} сек."
    },
    notifSection: {
      title: "Настройки уведомлений",
      email: "Email уведомления",
      emailDesc: "Еженедельные отчеты об уроках и успеваемости",
      push: "Push уведомления",
      pushDesc: "Важные события прямо в браузере",
      studentAct: "Активность студентов",
      studentActDesc: "Прогресс студентов и новые результаты",
      lessonRemind: "Напоминания об уроках",
      lessonRemindDesc: "Предупреждения перед началом живых лекций",
      marketing: "Рекомендации и новости",
      marketingDesc: "Новые модели AI и обновления системы"
    },
    securitySection: {
      title: "Настройки безопасности",
      changePass: "Изменить пароль",
      currPass: "Текущий пароль",
      newPass: "Новый пароль",
      confPass: "Подтвердите новый пароль",
      changeBtn: "Обновить пароль",
      twoFactor: "Двухфакторная аутентификация (2FA)",
      twoFactorDesc: "Защита аккаунта с помощью SMS или приложения Authenticator",
      active: "Активен",
      disabled: "Не активен",
      setup2fa: "Настроить 2FA",
      sessions: "Активные сессии",
      current: "Текущая",
      terminate: "Завершить"
    },
    prefSection: {
      title: "Настройки темы и региона",
      timezone: "Часовой пояс",
      theme: "Тема интерфейса",
      light: "Светлая тема",
      dark: "Темная тема",
      system: "Системная тема",
      langSelect: "Язык системы"
    },
    integrationsSection: {
      title: "Интеграции платформы",
      subtitle: "Подключение Lectio AI к внешним системам и ботам",
      telegram: "Уведомления в Telegram-бот",
      telegramDesc: "Получайте результаты занятий и быструю статистику прямо в Telegram",
      telegramBtn: "Подключить через Telegram",
      tgCode: "Ваш код подключения:",
      lms: "Интеграция с LMS / Moodle",
      lmsDesc: "Автоматическая отправка результатов студентов в систему Moodle вашей академии",
      lmsUrl: "Адрес портала LMS (URL)",
      lmsToken: "Ключ интеграции LMS (API Token)",
      autoExport: "Автоэкспорт отчетов Excel",
      autoExportDesc: "Отправка подробного Excel отчета на ваш профиль в конце каждого занятия"
    },
    helpSection: {
      title: "Помощь и поддержка",
      quick: "Быстрые каналы поддержки",
      guide: "Руководство пользователя",
      tech: "Техподдержка",
      phoneHelp: "Поддержка по телефону",
      videoHelp: "Видеоуроки",
      faq: "Часто задаваемые вопросы"
    }
  },
  en: {
    title: "Settings",
    subtitle: "Your profile, AI detector and system preferences",
    save: "Save",
    saving: "Saving...",
    saved: "Saved!",
    savedDesc: "Changes saved successfully",
    tabs: {
      profile: "Profile",
      ai: "AI Detector",
      notifications: "Notifications",
      security: "Security",
      preferences: "Theme & Language",
      integrations: "Integrations",
      help: "Help"
    },
    profileSection: {
      title: "Profile Information",
      avatarChange: "Change Photo",
      avatarHint: "JPG, PNG maximum 2MB",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      faculty: "Faculty / Department",
      bio: "About Me (Bio)",
      bioPlaceholder: "Write a short bio about yourself..."
    },
    aiSection: {
      title: "AI Attention Tracker Settings",
      subtitle: "Adjust AI neural net parameters supervising student activities",
      sensitivity: "Detector Sensitivity Level",
      sensLow: "Low",
      sensLowDesc: "Consumes fewer device resources",
      sensMed: "Medium",
      sensMedDesc: "Recommended standard mode",
      sensHigh: "High",
      sensHighDesc: "Maximum accuracy (high resource demand)",
      cameraSource: "Default Camera Source",
      phoneTrack: "Phone Detection Algorithm",
      phoneTrackDesc: "AI immediately flags if a student uses a smartphone during lessons",
      alertLow: "Low Attention Alert",
      alertLowDesc: "Display suggestions on screen when average attention falls below 50%",
      timeout: "Distraction Timeout",
      timeoutDesc: "Seconds look-away required to classify student as distracted",
      timeoutSec: "{sec} seconds"
    },
    notifSection: {
      title: "Notification Preferences",
      email: "Email Notifications",
      emailDesc: "Weekly lesson analysis and student reports",
      push: "Push Notifications",
      pushDesc: "Important events straight in your browser",
      studentAct: "Student Activity",
      studentActDesc: "Student progress updates and milestone results",
      lessonRemind: "Lesson Reminders",
      lessonRemindDesc: "Alerts before scheduled live lectures begin",
      marketing: "Tips & Newsletters",
      marketingDesc: "New AI models and system feature updates"
    },
    securitySection: {
      title: "Security Settings",
      changePass: "Change Password",
      currPass: "Current Password",
      newPass: "New Password",
      confPass: "Confirm New Password",
      changeBtn: "Update Password",
      twoFactor: "Two-Factor Authentication (2FA)",
      twoFactorDesc: "Protect your account via SMS or Authenticator app",
      active: "Active",
      disabled: "Disabled",
      setup2fa: "Configure 2FA",
      sessions: "Active Sessions",
      current: "Current",
      terminate: "Terminate"
    },
    prefSection: {
      title: "Theme and Region Settings",
      timezone: "Timezone",
      theme: "Interface Theme",
      light: "Light Theme",
      dark: "Dark Theme",
      system: "System Theme",
      langSelect: "System Language"
    },
    integrationsSection: {
      title: "Platform Integrations",
      subtitle: "Connect Lectio AI with external systems and bots",
      telegram: "Telegram Bot Notifications",
      telegramDesc: "Receive lesson results and quick analytics directly in Telegram",
      telegramBtn: "Connect via Telegram",
      tgCode: "Your connection code:",
      lms: "LMS / Moodle Integration",
      lmsDesc: "Automatically sync student scores and grades to your academy's Moodle system",
      lmsUrl: "LMS Portal URL",
      lmsToken: "LMS Integration API Token",
      autoExport: "Auto-Export Excel Reports",
      autoExportDesc: "Send a comprehensive Excel sheet to your profile at the end of each lesson"
    },
    helpSection: {
      title: "Help & Support",
      quick: "Quick Support Channels",
      guide: "User Manual",
      tech: "Tech Support",
      phoneHelp: "Support Hotline",
      videoHelp: "Video Tutorials",
      faq: "Frequently Asked Questions"
    }
  }
};

export default function ProfessorSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { toasts, addToast, removeToast } = useToast();
  
  // Safe Translation Picker
  const langKey = (language === "uz" || language === "ru" || language === "en") ? language : "uz";
  const t = dict[langKey];

  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Managed input states to fix floating labels instantly
  const [profile, setProfile] = useState({
    name: "Prof. John Doe",
    email: "john.doe@univer.uz",
    phone: "+998 90 123 45 67",
    faculty: "Axborot texnologiyalari fakulteti",
    bio: "Dasturiy ta'minot muhandisligi professori. 10+ yillik tajriba."
  });

  // AI custom states
  const [aiSensitivity, setAiSensitivity] = useState("medium");
  const [cameraSource, setCameraSource] = useState("webcam-1");
  const [phoneTracking, setPhoneTracking] = useState(true);
  const [lowAttentionAlert, setLowAttentionAlert] = useState(true);
  const [distractionTimeout, setDistractionTimeout] = useState(5); // Default 5 seconds

  // Notifications states
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifStudents, setNotifStudents] = useState(true);
  const [notifLessons, setNotifLessons] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Integrations states
  const [telegramNotifications, setTelegramNotifications] = useState(true);
  const [moodleSync, setMoodleSync] = useState(false);
  const [lmsUrl, setLmsUrl] = useState("https://lms.tuit.uz");
  const [lmsToken, setLmsToken] = useState("••••••••••••••••••••••••••••••••");
  const [autoExcelExport, setAutoExcelExport] = useState(true);

  // Security and Password change states
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confPass: "" });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const tabs = [
    { id: "profile", name: t.tabs.profile, icon: <User size={18} /> },
    { id: "ai", name: t.tabs.ai, icon: <Brain size={18} /> },
    { id: "notifications", name: t.tabs.notifications, icon: <Bell size={18} /> },
    { id: "security", name: t.tabs.security, icon: <Shield size={18} /> },
    { id: "preferences", name: t.tabs.preferences, icon: <Palette size={18} /> },
    { id: "integrations", name: t.tabs.integrations, icon: <Link2 size={18} /> },
    { id: "help", name: t.tabs.help, icon: <HelpCircle size={18} /> },
  ];

  // 1. LOAD PERSISTED SETTINGS FROM LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lectio_professor_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.aiSensitivity) setAiSensitivity(parsed.aiSensitivity);
          if (parsed.cameraSource) setCameraSource(parsed.cameraSource);
          if (parsed.phoneTracking !== undefined) setPhoneTracking(parsed.phoneTracking);
          if (parsed.lowAttentionAlert !== undefined) setLowAttentionAlert(parsed.lowAttentionAlert);
          if (parsed.distractionTimeout !== undefined) setDistractionTimeout(parsed.distractionTimeout);
          
          if (parsed.notifEmail !== undefined) setNotifEmail(parsed.notifEmail);
          if (parsed.notifPush !== undefined) setNotifPush(parsed.notifPush);
          if (parsed.notifStudents !== undefined) setNotifStudents(parsed.notifStudents);
          if (parsed.notifLessons !== undefined) setNotifLessons(parsed.notifLessons);
          if (parsed.notifMarketing !== undefined) setNotifMarketing(parsed.notifMarketing);

          if (parsed.telegramNotifications !== undefined) setTelegramNotifications(parsed.telegramNotifications);
          if (parsed.moodleSync !== undefined) setMoodleSync(parsed.moodleSync);
          if (parsed.lmsUrl) setLmsUrl(parsed.lmsUrl);
          if (parsed.lmsToken) setLmsToken(parsed.lmsToken);
          if (parsed.autoExcelExport !== undefined) setAutoExcelExport(parsed.autoExcelExport);
          if (parsed.is2FAEnabled !== undefined) setIs2FAEnabled(parsed.is2FAEnabled);
        } catch (e) {
          console.error("Failed to parse settings from localStorage", e);
        }
      }
    }
  }, []);

  // 2. SAVE SETTINGS PERSISTENCE TO LOCALSTORAGE
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const settingsObj = {
      profile,
      aiSensitivity,
      cameraSource,
      phoneTracking,
      lowAttentionAlert,
      distractionTimeout,
      notifEmail,
      notifPush,
      notifStudents,
      notifLessons,
      notifMarketing,
      telegramNotifications,
      moodleSync,
      lmsUrl,
      lmsToken,
      autoExcelExport,
      is2FAEnabled
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("lectio_professor_settings", JSON.stringify(settingsObj));
    }

    setIsSaving(false);
    addToast({ title: t.saved, description: t.savedDesc, type: "success" });
  };

  const handleChangePhoto = () => {
    addToast({ 
      title: language === "uz" ? "Rasm yuklash" : language === "ru" ? "Загрузка фото" : "Upload Photo", 
      description: language === "uz" ? "Fayl tanlash oynasi tez orada qo'shiladi" : language === "ru" ? "Диалоговое окно выбора файла будет добавлено в ближайшее время" : "File dialog window will be added shortly", 
      type: "info" 
    });
  };

  // 3. REAL PASSWORD VALIDATION FLOW
  const handleChangePassword = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confPass) {
      addToast({ 
        title: language === "uz" ? "Xatolik" : language === "ru" ? "Ошибка" : "Error",
        description: language === "uz" ? "Iltimos, barcha parollarni kiriting" : language === "ru" ? "Пожалуйста, введите все пароли" : "Please fill in all password fields",
        type: "error"
      });
      return;
    }
    if (passwords.newPass !== passwords.confPass) {
      addToast({ 
        title: language === "uz" ? "Xatolik" : language === "ru" ? "Ошибка" : "Error",
        description: language === "uz" ? "Yangi parollar bir-biriga mos kelmadi" : language === "ru" ? "Новые пароли не совпадают" : "New passwords do not match",
        type: "error"
      });
      return;
    }
    addToast({ 
      title: language === "uz" ? "Parol o'zgartirildi!" : language === "ru" ? "Пароль изменен!" : "Password Changed!", 
      description: language === "uz" ? "Yangi parol muvaffaqiyatli saqlandi" : language === "ru" ? "Новый пароль успешно сохранен" : "New password has been successfully saved", 
      type: "success" 
    });
    setPasswords({ current: "", newPass: "", confPass: "" });
  };

  // 4. REAL 2FA INTEGRATION MODAL TRIGGER
  const handle2FASetupToggle = () => {
    if (is2FAEnabled) {
      setIs2FAEnabled(false);
      addToast({ 
        title: "2FA", 
        description: language === "uz" ? "Ikki bosqichli himoya o'chirildi" : language === "ru" ? "Двухфакторная защита отключена" : "Two-factor auth has been disabled", 
        type: "warning" 
      });
    } else {
      setIs2FAModalOpen(true);
    }
  };

  const handleVerify2FACode = () => {
    if (verificationCode.trim().length < 6) {
      addToast({ 
        title: "2FA Error", 
        description: language === "uz" ? "Kodni to'liq kiriting" : language === "ru" ? "Введите полный код" : "Please enter the complete 6-digit code", 
        type: "error" 
      });
      return;
    }
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    setVerificationCode("");
    addToast({ 
      title: "2FA Active", 
      description: language === "uz" ? "Ikki bosqichli himoya muvaffaqiyatli yoqildi" : language === "ru" ? "Двухфакторная защита успешно включена" : "Two-factor auth successfully enabled", 
      type: "success" 
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-wider text-white uppercase">{t.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Save size={16} />}
          onClick={handleSave}
          isLoading={isSaving}
          className="w-full sm:w-auto"
        >
          {t.save}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-72 shrink-0">
          <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
            <nav className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-[#F5A623] text-black font-bold shadow-lg shadow-[#F5A623]/25 scale-[1.02]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={activeTab === tab.id ? "text-black" : "text-[#F5A623]"}>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Panel */}
        <div className="flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-6 font-display tracking-wide">{t.profileSection.title}</h2>
                  <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="relative group">
                        <Avatar initials="JD" size="xl" className="w-24 h-24 border-2 border-[#F5A623] shadow-lg shadow-[#F5A623]/10" />
                        <button
                          onClick={handleChangePhoto}
                          className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#F5A623] rounded-full flex items-center justify-center text-black hover:bg-[#e8941a] transition-transform active:scale-95 shadow-md shadow-[#F5A623]/20"
                        >
                          <Camera size={16} />
                        </button>
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <Button variant="secondary" size="sm" onClick={handleChangePhoto} className="h-9">{t.profileSection.avatarChange}</Button>
                        <p className="text-xs text-slate-400 mt-1">{t.profileSection.avatarHint}</p>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        label={t.profileSection.name} 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      />
                      <Input 
                        label={t.profileSection.email} 
                        value={profile.email} 
                        leftIcon={<Mail size={18} />} 
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                      />
                      <Input 
                        label={t.profileSection.phone} 
                        value={profile.phone} 
                        leftIcon={<Phone size={18} />} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                      />
                      <Input 
                        label={t.profileSection.faculty} 
                        value={profile.faculty} 
                        onChange={(e) => setProfile({ ...profile, faculty: e.target.value })} 
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">{t.profileSection.bio}</label>
                      <textarea
                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#18181F]/90 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none transition duration-300 min-h-[110px]"
                        rows={4}
                        placeholder={t.profileSection.bioPlaceholder}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* AI DETECTOR TAB */}
              {activeTab === "ai" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white font-display tracking-wide">{t.aiSection.title}</h2>
                    <p className="text-slate-400 text-sm mt-1">{t.aiSection.subtitle}</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Sensitivity Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Sliders size={16} className="text-[#F5A623]" />
                        {t.aiSection.sensitivity}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: "low", label: t.aiSection.sensLow, desc: t.aiSection.sensLowDesc },
                          { id: "medium", label: t.aiSection.sensMed, desc: t.aiSection.sensMedDesc },
                          { id: "high", label: t.aiSection.sensHigh, desc: t.aiSection.sensHighDesc }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAiSensitivity(opt.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                              aiSensitivity === opt.id
                                ? "border-[#F5A623] bg-[#F5A623]/5 shadow-md shadow-[#F5A623]/5"
                                : "border-white/5 hover:border-white/20 bg-slate-950/20"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold text-sm ${aiSensitivity === opt.id ? "text-[#F5A623]" : "text-white"}`}>{opt.label}</span>
                              {aiSensitivity === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />}
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Camera Source Selector */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Video size={16} className="text-[#F5A623]" />
                        {t.aiSection.cameraSource}
                      </label>
                      <select 
                        value={cameraSource}
                        onChange={(e) => setCameraSource(e.target.value)}
                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#18181F] text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] cursor-pointer"
                      >
                        <option value="webcam-1">Integratsiyalashgan HD veb-kamera (Birlamchi)</option>
                        <option value="webcam-2">Logitech HD Pro Webcam C920</option>
                        <option value="webcam-obs">OBS Virtual Camera Source</option>
                      </select>
                    </div>

                    {/* AI Feature Toggles */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div className="max-w-[85%]">
                          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                            <Smartphone size={16} className="text-[#F5A623]" />
                            {t.aiSection.phoneTrack}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{t.aiSection.phoneTrackDesc}</p>
                        </div>
                        <Switch checked={phoneTracking} onChange={setPhoneTracking} />
                      </div>

                      <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div className="max-w-[85%]">
                          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-[#F5A623]" />
                            {t.aiSection.alertLow}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{t.aiSection.alertLowDesc}</p>
                        </div>
                        <Switch checked={lowAttentionAlert} onChange={setLowAttentionAlert} />
                      </div>
                    </div>

                    {/* Timeout Range Selector */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Eye size={16} className="text-[#F5A623]" />
                        {t.aiSection.timeout}
                      </label>
                      <p className="text-xs text-slate-400 mb-2">{t.aiSection.timeoutDesc}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="2"
                          max="15"
                          value={distractionTimeout}
                          onChange={(e) => setDistractionTimeout(Number(e.target.value))}
                          className="flex-1 h-1.5 rounded-lg bg-slate-700 accent-[#F5A623] cursor-pointer"
                        />
                        <span className="text-sm font-bold text-[#F5A623] shrink-0 bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">
                          {t.aiSection.timeoutSec.replace("{sec}", String(distractionTimeout))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-6 font-display tracking-wide">{t.notifSection.title}</h2>
                  <div className="space-y-2">
                    {[
                      { id: "email", title: t.notifSection.email, description: t.notifSection.emailDesc, checked: notifEmail, onChange: setNotifEmail },
                      { id: "push", title: t.notifSection.push, description: t.notifSection.pushDesc, checked: notifPush, onChange: setNotifPush },
                      { id: "students", title: t.notifSection.studentAct, description: t.notifSection.studentActDesc, checked: notifStudents, onChange: setNotifStudents },
                      { id: "lessons", title: t.notifSection.lessonRemind, description: t.notifSection.lessonRemindDesc, checked: notifLessons, onChange: setNotifLessons },
                      { id: "marketing", title: t.notifSection.marketing, description: t.notifSection.marketingDesc, checked: notifMarketing, onChange: setNotifMarketing },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                        <div className="max-w-[85%]">
                          <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <Switch checked={item.checked} onChange={(checked) => {
                          item.onChange(checked);
                          addToast({ title: item.title, description: checked ? "Yoqildi" : "O'chirildi", type: "info" });
                        }} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-6 font-display tracking-wide">{t.securitySection.title}</h2>
                  <div className="space-y-8">
                    {/* Password change */}
                    <div className="space-y-4 pb-6 border-b border-white/5">
                      <h3 className="font-bold text-md text-[#F5A623] flex items-center gap-2">
                        <Lock size={18} />
                        {t.securitySection.changePass}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          label={t.securitySection.currPass} 
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          label={t.securitySection.newPass} 
                          value={passwords.newPass}
                          onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          label={t.securitySection.confPass} 
                          value={passwords.confPass}
                          onChange={(e) => setPasswords({ ...passwords, confPass: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="secondary" leftIcon={<Key size={14} />} onClick={handleChangePassword}>
                          {t.securitySection.changeBtn}
                        </Button>
                      </div>
                    </div>

                    {/* 2FA */}
                    <div className="space-y-4 pb-6 border-b border-white/5">
                      <h3 className="font-bold text-md text-[#F5A623] flex items-center gap-2">
                        <Shield size={18} />
                        {t.securitySection.twoFactor}
                      </h3>
                      <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-slate-950/20">
                        <div>
                          <h4 className="font-semibold text-white text-sm">Authenticator App (2FA)</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{t.securitySection.twoFactorDesc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge color={is2FAEnabled ? "jade" : "coral"} size="sm">
                            {is2FAEnabled ? t.securitySection.active : t.securitySection.disabled}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={handle2FASetupToggle} className="border border-white/10 h-9">
                            {is2FAEnabled ? (language === "uz" ? "O'chirish" : language === "ru" ? "Отключить" : "Disable") : t.securitySection.setup2fa}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-md text-white">{t.securitySection.sessions}</h3>
                      <div className="space-y-3">
                        {[
                          { device: "Chrome — Windows 11", location: "Toshkent, UZ", time: "Hozir", current: true },
                          { device: "Safari — iPhone 15", location: "Toshkent, UZ", time: "1 soat oldin", current: false },
                        ].map((session, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-slate-950/20">
                            <div>
                              <p className="font-bold text-white text-sm">{session.device}</p>
                              <p className="text-xs text-slate-400 mt-1">{session.location} • {session.time}</p>
                            </div>
                            {session.current ? (
                              <Badge color="jade" size="sm">{t.securitySection.current}</Badge>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs text-red-400 hover:bg-red-500/10" 
                                onClick={() => addToast({ 
                                  title: language === "uz" ? "Sessiya tugatildi" : language === "ru" ? "Сессия завершена" : "Session terminated", 
                                  description: `${session.device} sessiyasi muvaffaqiyatli tugatildi`, 
                                  type: "warning" 
                                })}
                              >
                                {t.securitySection.terminate}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === "preferences" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-6 font-display tracking-wide">{t.prefSection.title}</h2>
                  <div className="space-y-8">
                    {/* Language Settings */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Globe size={16} className="text-[#F5A623]" />
                        {t.prefSection.langSelect}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { code: "uz", label: "O'zbekcha", native: "O'zbek", flag: "🇺🇿" },
                          { code: "ru", label: "Русский", native: "Русский", flag: "🇷🇺" },
                          { code: "en", label: "English", native: "English", flag: "🇬🇧" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => { setLanguage(lang.code as any); }}
                            className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all duration-300 ${
                              language === lang.code
                                ? "border-[#F5A623] bg-[#F5A623]/5"
                                : "border-white/5 hover:border-white/20 bg-slate-950/20"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{lang.flag}</span>
                              <div className="text-left">
                                <p className="font-bold text-sm text-white">{lang.native}</p>
                                <p className="text-xs text-slate-400">{lang.label}</p>
                              </div>
                            </div>
                            {language === lang.code && (
                              <div className="w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center">
                                <Check size={12} className="text-black font-bold" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Monitor size={16} className="text-[#F5A623]" />
                        {t.prefSection.timezone}
                      </label>
                      <select className="w-full px-4 py-3 border border-white/10 rounded-xl bg-[#18181F] text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] cursor-pointer">
                        <option>Tashkent (UTC+5)</option>
                        <option>Moscow (UTC+3)</option>
                        <option>London (UTC+0)</option>
                      </select>
                    </div>

                    {/* Theme Settings */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Palette size={16} className="text-[#F5A623]" />
                        {t.prefSection.theme}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { value: "light", label: t.prefSection.light, icon: <Sun size={20} /> },
                          { value: "dark", label: t.prefSection.dark, icon: <Moon size={20} /> },
                          { value: "system", label: t.prefSection.system, icon: <Monitor size={20} /> },
                        ].map((themeOpt) => (
                          <button
                            key={themeOpt.value}
                            type="button"
                            onClick={() => {
                              setTheme(themeOpt.value as any);
                              addToast({ 
                                title: language === "uz" ? "Mavzu o'zgartirildi" : language === "ru" ? "Тема изменена" : "Theme Changed", 
                                description: `${themeOpt.label} tanlandi`, 
                                type: "info" 
                              });
                            }}
                            className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all duration-300 ${
                              theme === themeOpt.value
                                ? "border-[#F5A623] bg-[#F5A623]/5"
                                : "border-white/5 hover:border-white/20 bg-slate-950/20"
                            }`}
                          >
                            <div className="flex items-start justify-between w-full mb-3">
                              <span className={theme === themeOpt.value ? "text-[#F5A623]" : "text-slate-400"}>
                                {themeOpt.icon}
                              </span>
                              {theme === themeOpt.value && (
                                <div className="w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center">
                                  <Check size={12} className="text-black font-bold" />
                                </div>
                              )}
                            </div>
                            <p className="font-bold text-sm text-white">{themeOpt.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* INTEGRATIONS TAB */}
              {activeTab === "integrations" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-white font-display tracking-wide">{t.integrationsSection.title}</h2>
                    <p className="text-slate-400 text-sm mt-1">{t.integrationsSection.subtitle}</p>
                  </div>

                  <div className="space-y-6">
                    {/* Telegram Bot */}
                    <div className="p-5 border border-white/10 rounded-2xl bg-slate-950/20 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="max-w-[80%]">
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#F5A623]" />
                            {t.integrationsSection.telegram}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">{t.integrationsSection.telegramDesc}</p>
                        </div>
                        <Switch checked={telegramNotifications} onChange={setTelegramNotifications} />
                      </div>

                      {telegramNotifications && (
                        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-xs text-slate-400 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 w-full sm:w-auto">
                            {t.integrationsSection.tgCode} <span className="font-mono font-bold text-[#F5A623] ml-1 bg-[#F5A623]/10 px-2 py-0.5 rounded border border-[#F5A623]/25">LECTIO_PROF_9921</span>
                          </div>
                          <a 
                            href="https://t.me/lectio_ai_bot" 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#e8941a] px-4 py-2.5 text-xs font-bold text-black hover:scale-[1.02] active:scale-95 transition-transform"
                          >
                            {t.integrationsSection.telegramBtn}
                            <ArrowRight size={12} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Moodle / LMS Integration */}
                    <div className="p-5 border border-white/10 rounded-2xl bg-slate-950/20 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="max-w-[80%]">
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Server size={16} className="text-[#F5A623]" />
                            {t.integrationsSection.lms}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">{t.integrationsSection.lmsDesc}</p>
                        </div>
                        <Switch checked={moodleSync} onChange={setMoodleSync} />
                      </div>

                      {moodleSync && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-3 border-t border-white/5 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                              label={t.integrationsSection.lmsUrl} 
                              value={lmsUrl}
                              onChange={(e) => setLmsUrl(e.target.value)}
                            />
                            <Input 
                              label={t.integrationsSection.lmsToken} 
                              value={lmsToken}
                              onChange={(e) => setLmsToken(e.target.value)}
                              type="password"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Excel Auto Export */}
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                      <div className="max-w-[85%]">
                        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                          <Globe size={16} className="text-[#F5A623]" />
                          {t.integrationsSection.autoExport}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{t.integrationsSection.autoExportDesc}</p>
                      </div>
                      <Switch checked={autoExcelExport} onChange={setAutoExcelExport} />
                    </div>
                  </div>
                </Card>
              )}

              {/* HELP TAB */}
              {activeTab === "help" && (
                <Card variant="glass" className="border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <h2 className="text-xl font-bold text-white mb-6 font-display tracking-wide">{t.helpSection.title}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-sm text-slate-300 mb-4">{t.helpSection.quick}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="secondary" className="justify-start border border-white/10" onClick={() => addToast({ title: t.helpSection.guide, description: "Foydalanuvchi qo'llanmasi tez orada ochiladi", type: "info" })}>
                          <HelpCircle size={18} className="mr-2 text-[#F5A623]" /> {t.helpSection.guide}
                        </Button>
                        <Button variant="secondary" className="justify-start border border-white/10" onClick={() => addToast({ title: t.helpSection.tech, description: "support@lectio.uz manziliga yozing", type: "info" })}>
                          <Mail size={18} className="mr-2 text-[#F5A623]" /> {t.helpSection.tech}
                        </Button>
                        <Button variant="secondary" className="justify-start border border-white/10" onClick={() => addToast({ title: t.helpSection.phoneHelp, description: "+998 71 123 45 67 • Dush-Juma 9:00-18:00", type: "info" })}>
                          <Phone size={18} className="mr-2 text-[#F5A623]" /> {t.helpSection.phoneHelp}
                        </Button>
                        <Button variant="secondary" className="justify-start border border-white/10" onClick={() => addToast({ title: t.helpSection.videoHelp, description: "YouTube kanaliga o'tish tez orada qo'shiladi", type: "info" })}>
                          <Globe size={18} className="mr-2 text-[#F5A623]" /> {t.helpSection.videoHelp}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-300 mb-4">{t.helpSection.faq}</h3>
                      <div className="space-y-4">
                        {[
                          { q: "Qanday qilib yangi dars yaratish mumkin?", a: "Dars yaratish bo'limiga o'ting va kerakli ma'lumotlarni to'ldiring. AI avtomatik slaydlar va testlar yaratib beradi." },
                          { q: "Talabalar progressini qanday ko'rish mumkin?", a: "Talabalar bo'limida barcha talabalarning statistikasini ko'rishingiz va har birining batafsil profilini ochishingiz mumkin." },
                          { q: "Quiz qanday ishlaydi?", a: "Jonli Quiz bo'limiga o'ting, yangi xona yarating. Talabalar xona kodi orqali qo'shiladi. Siz savollarni birin-ketin yuborasiz." },
                        ].map((faq, index) => (
                          <div key={index} className="border border-white/10 rounded-xl p-4 bg-slate-950/20">
                            <h4 className="font-semibold text-white text-sm mb-2">{faq.q}</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              leftIcon={<Save size={16} />}
              onClick={handleSave}
              isLoading={isSaving}
              className="w-full sm:w-auto"
            >
              {t.save}
            </Button>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE 2FA CONFIRMATION MODAL POPUP */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIs2FAModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C14]/90 backdrop-blur-2xl p-6 md:p-8 text-white shadow-2xl z-10"
            >
              <button 
                onClick={() => setIs2FAModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] border border-[#F5A623]/25 shadow-lg shadow-[#F5A623]/5">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display tracking-wide text-white">2FA Aktivlashtirish</h3>
                  <p className="text-xs text-slate-400 mt-1">Gugl Authenticator yoki boshqa 2FA ilovasidan quyidagi QR kodni skanerlang va kodni kiriting.</p>
                </div>

                {/* Mock QR Code representation */}
                <div className="mx-auto w-40 h-40 bg-white p-3 rounded-2xl border-4 border-[#F5A623]/30 flex items-center justify-center shadow-inner relative group overflow-hidden">
                  <div className="grid grid-cols-5 gap-2 w-full h-full opacity-90">
                    {Array.from({ length: 25 }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-sm ${(idx % 2 === 0 && idx % 3 !== 0) || idx === 0 || idx === 4 || idx === 20 || idx === 24 ? "bg-black" : "bg-transparent"}`} 
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-black font-bold font-mono bg-white px-2 py-1 rounded shadow-md">LECTIO_2FA_KEY</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input 
                    placeholder="123456" 
                    label="Tasdiqlash kodi" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center font-mono font-bold tracking-widest text-lg"
                  />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIs2FAModalOpen(false)} className="flex-1 border border-white/5">
                      {language === "uz" ? "Bekor qilish" : language === "ru" ? "Отмена" : "Cancel"}
                    </Button>
                    <Button variant="primary" onClick={handleVerify2FACode} className="flex-1">
                      {language === "uz" ? "Tasdiqlash" : language === "ru" ? "Подтвердить" : "Verify"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
