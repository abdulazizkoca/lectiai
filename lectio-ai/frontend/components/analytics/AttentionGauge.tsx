"use client";

interface AttentionGaugeProps {
  attention: number; // 0-1
  confusion: boolean;
  boredom: boolean;
  students: number;
  recommendation: string | null;
}

import { useLanguage } from "@/contexts/LanguageContext";

export default function AttentionGauge({
  attention,
  confusion,
  boredom,
  students,
  recommendation,
}: AttentionGaugeProps) {
  const percentage = Math.round(attention * 100);

  const getColor = () => {
    if (percentage >= 70) return "text-emerald-400";
    if (percentage >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getGradient = () => {
    if (percentage >= 70) return "from-emerald-500 to-teal-500";
    if (percentage >= 50) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getEmoji = () => {
    if (percentage >= 80) return "🎯";
    if (percentage >= 60) return "👀";
    if (percentage >= 40) return "😐";
    return "😴";
  };

  const { t } = useLanguage();

  const getRecommendationUI = () => {
    switch (recommendation) {
      case "polling":
        return {
          icon: "📊",
          text: t("gauge.polling"),
          color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
        };
      case "wow_fact":
        return {
          icon: "🤯",
          text: t("gauge.wow_fact"),
          color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
        };
      case "interaction":
        return {
          icon: "💬",
          text: t("gauge.interaction"),
          color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
        };
      default:
        return null;
    }
  };

  const rec = getRecommendationUI();

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t("gauge.title")}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="live-dot" />
          <span className="text-slate-400">{students} {t("gauge.students")}</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              className={`stroke-current ${getColor()}`}
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.64} 264`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl">{getEmoji()}</span>
            <span className={`text-xl font-bold ${getColor()}`}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex gap-3 justify-center">
        {confusion && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
            😕 {t("gauge.confusion")}
          </span>
        )}
        {boredom && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
            😴 {t("gauge.boredom")}
          </span>
        )}
        {!confusion && !boredom && percentage >= 60 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            ✨ {t("gauge.good")}
          </span>
        )}
      </div>

      {/* AI Recommendation */}
      {rec && (
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border ${rec.color} slide-up`}
        >
          <span className="text-xl">{rec.icon}</span>
          <span className="text-sm font-medium">{rec.text}</span>
        </div>
      )}

      {/* Mini Bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
