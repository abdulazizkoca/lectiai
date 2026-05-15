"use client";

import React, { useState } from "react";
import { Settings, User, Bell, Shield, Globe, Palette, HelpCircle, Save, Mail, Phone, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

export default function ProfessorSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { toasts, addToast, removeToast } = useToast();

  const tabs = [
    { id: "profile", name: "Profil", icon: <User size={18} /> },
    { id: "notifications", name: "Bildirishnomalar", icon: <Bell size={18} /> },
    { id: "security", name: "Xavfsizlik", icon: <Shield size={18} /> },
    { id: "preferences", name: "Afzunaliklar", icon: <Palette size={18} /> },
    { id: "help", name: "Yordam", icon: <HelpCircle size={18} /> },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    addToast({ title: "Saqlandi!", description: "O'zgartirishlar muvaffaqiyatli saqlandi", type: "success" });
  };

  const handleChangePhoto = () => {
    addToast({ title: "Rasm yuklash", description: "Fayl tanlash oynasi tez orada qo'shiladi", type: "info" });
  };

  const handleChangePassword = () => {
    addToast({ title: "Parol o'zgartirildi!", description: "Yangi parol muvaffaqiyatli saqlandi", type: "success" });
  };

  const handle2FASetup = () => {
    addToast({ title: "2FA sozlamalari", description: "QR kod va tasdiqlash kodi tez orada keladi", type: "info" });
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sozlamalar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Profilingiz va tizim sozlamalari</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#F5A623]/10 text-[#F5A623]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Profil ma&apos;lumotlari</h2>
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar initials="JD" size="lg" className="w-20 h-20" />
                    <button
                      onClick={handleChangePhoto}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#F5A623] rounded-full flex items-center justify-center text-black hover:bg-[#e8941a] transition-colors"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <Button variant="secondary" size="sm" onClick={handleChangePhoto}>Rasmni o&apos;zgartirish</Button>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">JPG, PNG maksimal 2MB</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Ism va familiya" defaultValue="Prof. John Doe" />
                  <Input label="Email manzil" defaultValue="john.doe@univer.uz" leftIcon={<Mail size={18} />} />
                  <Input label="Telefon raqam" defaultValue="+998 90 123 45 67" leftIcon={<Phone size={18} />} />
                  <Input label="Fakultet" defaultValue="Axborot texnologiyalari fakulteti" />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent resize-none"
                    rows={4}
                    defaultValue="Dasturiy ta'minot muhandisligi professori. 10+ yillik tajriba."
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Bildirishnomalar sozlamalari</h2>
              <div className="space-y-4">
                {[
                  { id: "email", title: "Email bildirishnomalari", description: "Yangi darslar va talabalar faoliyati haqida", default: true },
                  { id: "push", title: "Push bildirishnomalari", description: "Muhim voqealar haqida brauzerda", default: true },
                  { id: "students", title: "Talabalar faoliyati", description: "Talabalar progressi va natijalari", default: true },
                  { id: "lessons", title: "Darslar eslatmalari", description: "Boshlanadigan darslar haqida eslatma", default: true },
                  { id: "marketing", title: "Marketing xabarlari", description: "Yangi xususiyatlar va takliflar", default: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.default} onChange={(checked) => addToast({ title: item.title, description: checked ? "Yoqildi" : "O'chirildi", type: "info" })} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Xavfsizlik sozlamalari</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Parolni o&apos;zgartirish</h3>
                  <div className="space-y-4">
                    <Input type="password" placeholder="Joriy parol" label="Joriy parol" />
                    <Input type="password" placeholder="Yangi parol" label="Yangi parol" />
                    <Input type="password" placeholder="Yangi parolni tasdiqlang" label="Yangi parolni tasdiqlang" />
                    <Button variant="primary" onClick={handleChangePassword}>Parolni o&apos;zgartirish</Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Ikki faktli autentifikatsiya</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">2FA yoqilgan</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Hisobingiz qo&apos;shimcha himoyalangan</p>
                      </div>
                      <Badge color="jade" size="sm">Faol</Badge>
                    </div>
                    <Button variant="secondary" onClick={handle2FASetup}>2FA sozlamalari</Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Faol sessiyalar</h3>
                  <div className="space-y-3">
                    {[
                      { device: "Chrome — Windows 11", location: "Toshkent, UZ", time: "Hozir", current: true },
                      { device: "Safari — iPhone 15", location: "Toshkent, UZ", time: "1 soat oldin", current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{session.device}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{session.location} • {session.time}</p>
                        </div>
                        {session.current ? (
                          <Badge color="jade" size="sm">Joriy</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => addToast({ title: "Sessiya tugatildi", description: `${session.device} sessiyasi tugatildi`, type: "warning" })}>Tugatish</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Afzunaliklar</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Til va mintaqa</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interfeys tili</label>
                      <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]">
                        <option>O&apos;zbekcha</option>
                        <option>English</option>
                        <option>Русский</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vaqt zonasi</label>
                      <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]">
                        <option>Toshkent (UTC+5)</option>
                        <option>Moscow (UTC+3)</option>
                        <option>London (UTC+0)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Mavzu</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setTheme("light"); addToast({ title: "Mavzu o'zgartirildi", description: "Yorqin mavzu tanlandi", type: "info" }); }}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${theme === "light" ? "border-[#F5A623]" : "border-slate-300 dark:border-slate-600 hover:border-[#F5A623]/50"}`}
                    >
                      <div className="w-8 h-8 bg-white border border-slate-300 rounded mx-auto mb-2"></div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Yorqin</span>
                    </button>
                    <button
                      onClick={() => { setTheme("dark"); addToast({ title: "Mavzu o'zgartirildi", description: "Qorong'u mavzu tanlandi", type: "info" }); }}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${theme === "dark" ? "border-[#F5A623]" : "border-slate-300 dark:border-slate-600 hover:border-[#F5A623]/50"}`}
                    >
                      <div className="w-8 h-8 bg-slate-900 rounded mx-auto mb-2"></div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">Qorong&apos;u</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "help" && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Yordam va qo&apos;llab-quvvatlash</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Tez yordam</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="secondary" className="justify-start" onClick={() => addToast({ title: "Qo'llanma", description: "Foydalanuvchi qo'llanmasi tez orada ochiladi", type: "info" })}>
                      <HelpCircle size={18} className="mr-2" />Qo&apos;llanma
                    </Button>
                    <Button variant="secondary" className="justify-start" onClick={() => addToast({ title: "Texnik yordam", description: "support@lectio.uz manziliga yozing", type: "info" })}>
                      <Mail size={18} className="mr-2" />Texnik yordam
                    </Button>
                    <Button variant="secondary" className="justify-start" onClick={() => addToast({ title: "Telefon yordam", description: "+998 71 123 45 67 • Dush-Juma 9:00-18:00", type: "info" })}>
                      <Phone size={18} className="mr-2" />Telefon orqali yordam
                    </Button>
                    <Button variant="secondary" className="justify-start" onClick={() => addToast({ title: "Video darslar", description: "YouTube kanaliga o'tish tez orada qo'shiladi", type: "info" })}>
                      <Globe size={18} className="mr-2" />Video darslar
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Tez-tez so&apos;raladigan savollar</h3>
                  <div className="space-y-4">
                    {[
                      { q: "Qanday qilib yangi dars yaratish mumkin?", a: "Dars yaratish bo'limiga o'ting va kerakli ma'lumotlarni to'ldiring. AI avtomatik slaydlar va testlar yaratib beradi." },
                      { q: "Talabalar progressini qanday ko'rish mumkin?", a: "Talabalar bo'limida barcha talabalarning statistikasini ko'rishingiz va har birining batafsil profilini ochishingiz mumkin." },
                      { q: "Quiz qanday ishlaydi?", a: "Jonli Quiz bo'limiga o'ting, yangi xona yarating. Talabalar xona kodi orqali qo'shiladi. Siz savollarni birin-ketin yuborasiz." },
                    ].map((faq, index) => (
                      <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">{faq.q}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              leftIcon={<Save size={16} />}
              onClick={handleSave}
              isLoading={isSaving}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
