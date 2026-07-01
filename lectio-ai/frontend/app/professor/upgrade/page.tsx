"use client";
import React, { useState } from "react";
import { Crown, Check, Zap, Star, Users, BarChart2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

const plans = [
  {
    id: "basic",
    name: "Asosiy",
    price: "Bepul",
    period: "",
    color: "slate",
    badge: null,
    features: [
      "5 ta dars yaratish",
      "30 ta talabagacha",
      "Asosiy analitika",
      "Quiz (5 savolga qadar)",
    ],
    missing: ["AI dars generatsiyasi", "Kamera kuzatuvi", "Telegram bot", "CSV eksport"],
  },
  {
    id: "pro",
    name: "Premium",
    price: "149 000",
    period: "so'm/oy",
    color: "amber",
    badge: "Eng mashhur",
    features: [
      "Cheksiz darslar",
      "Cheksiz talabalar",
      "AI dars generatsiyasi ✨",
      "Kamera diqqat kuzatuvi 📹",
      "To'liq analitika va grafiklar",
      "Cheksiz Quiz savollari",
      "Telegram bot integratsiyasi",
      "CSV/PDF eksport",
      "Ustuvor texnik yordam",
    ],
    missing: [],
  },
  {
    id: "institution",
    name: "Muassasa",
    price: "Aloqaga chiqing",
    period: "",
    color: "violet",
    badge: "Universitetlar uchun",
    features: [
      "Premium-dagi hamma narsa",
      "Bir nechta professorlar",
      "Admin panel",
      "SSO (Single Sign-On)",
      "Maxsus integratsiyalar",
      "Bag'ishlangan server",
      "SLA kafolati",
    ],
    missing: [],
  },
];

export default function UpgradePage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { toasts, addToast, removeToast } = useToast();

  const handleUpgrade = (plan: string) => {
    if (plan === "institution") {
      addToast({ title: "Aloqaga chiqish", description: "info@lectio.uz manziliga yozing yoki +998 71 123 45 67 ga qo'ng'iroq qiling.", type: "info" });
    } else {
      addToast({ title: "To'lov tizimi", description: "To'lov integratsiyasi tez orada qo'shiladi. Biz siz bilan bog'lanamiz!", type: "info" });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-amethyst/10 text-amethyst px-4 py-2 rounded-full text-sm font-bold mb-4">
          <Crown size={16} />
          Premium Rejalar
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          O'qitishni yangi darajaga olib chiqing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          AI yordamida dars tayyorlang, talabalar diqqatini kuzating va chuqur analitika oling
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${billing === "monthly" ? "bg-saffron text-black" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Oylik
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${billing === "yearly" ? "bg-saffron text-black" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Yillik
            <Badge color="jade" size="sm">20% tejam</Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative p-6 flex flex-col ${plan.id === "pro" ? "border-saffron border-2 shadow-xl shadow-saffron/10" : ""}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.id === "pro" ? "bg-saffron text-black" : "bg-amethyst text-white"}`}>
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {billing === "yearly" && plan.price !== "Bepul" && plan.price !== "Aloqaga chiqing"
                    ? Math.round(parseInt(plan.price.replace(/\s/g, "")) * 0.8).toLocaleString("uz-UZ")
                    : plan.price}
                </span>
                {plan.period && <span className="text-slate-500 dark:text-slate-400 text-sm">{plan.period}</span>}
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check size={16} className="text-jade mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
              {plan.missing.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400 line-through">
                  <span className="w-4 h-4 mt-0.5 shrink-0 text-center text-xs">✗</span>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant={plan.id === "pro" ? "primary" : "secondary"}
              className="w-full"
              onClick={() => handleUpgrade(plan.id)}
            >
              {plan.id === "basic" ? "Joriy reja" : plan.id === "institution" ? "Aloqaga chiqish" : "Premium Olish"}
            </Button>
          </Card>
        ))}
      </div>

      {/* Features comparison */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-saffron" />
          Premium xususiyatlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Zap size={20} />, title: "AI Generatsiya", desc: "Mavzudan avtomatik slaydlar va testlar", color: "text-saffron bg-saffron/10" },
            { icon: <Star size={20} />, title: "Kamera Kuzatuvi", desc: "Real vaqtda diqqat tahlili", color: "text-jade bg-jade/10" },
            { icon: <Users size={20} />, title: "Telegram Bot", desc: "Talabalarga avtomatik xabarlar", color: "text-lapis bg-lapis/10" },
            { icon: <BarChart2 size={20} />, title: "Chuqur Analitika", desc: "Har bir talabaning profili", color: "text-amethyst bg-amethyst/10" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
                {item.icon}
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
