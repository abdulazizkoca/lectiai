"use client";
import { useState } from "react";

interface Slide {
  slide_number: number;
  title: string;
  content: string;
  speaker_notes?: string;
  duration_minutes?: number;
  interaction?: string | null;
}

interface SlideViewerProps {
  slides: Slide[];
  wowFact?: string;
}

export default function SlideViewer({ slides, wowFact }: SlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showWow, setShowWow] = useState(false);

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  // WOW fact overlay at start
  if (showWow && wowFact) {
    return (
      <div className="glass-card p-8 text-center space-y-6 slide-up">
        <div className="text-6xl animate-bounce">🤯</div>
        <h2 className="text-2xl font-bold gradient-text">WOW Fakt!</h2>
        <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
          {wowFact}
        </p>
        <button
          onClick={() => setShowWow(false)}
          className="btn-primary"
          id="dismiss-wow-btn"
        >
          Darsni Boshlash →
        </button>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-slate-400 tabular-nums">
          {current + 1}/{slides.length}
        </span>
      </div>

      {/* Slide Content */}
      <div className="glass-card p-8 min-h-[350px] flex flex-col justify-center slide-up" key={current}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full font-medium">
              Slayd {slide.slide_number}
            </span>
            {slide.duration_minutes && (
              <span className="text-xs text-slate-500">
                ⏱ {slide.duration_minutes} daqiqa
              </span>
            )}
            {slide.interaction && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium">
                🎯 {slide.interaction}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold">{slide.title}</h2>
          <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">
            {slide.content}
          </p>
        </div>
      </div>

      {/* Speaker Notes */}
      {slide.speaker_notes && (
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1"
            id="toggle-notes-btn"
          >
            {showNotes ? "▼" : "▶"} Professor eslatmasi
          </button>
          {showNotes && (
            <div className="mt-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-200/80 slide-up">
              {slide.speaker_notes}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
          id="prev-slide-btn"
        >
          ← Oldingi
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current
                  ? "bg-indigo-500 scale-125"
                  : "bg-white/15 hover:bg-white/30"
              }`}
              id={`slide-dot-${i}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          id="next-slide-btn"
        >
          Keyingi →
        </button>
      </div>
    </div>
  );
}
