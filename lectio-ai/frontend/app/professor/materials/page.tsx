"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Stage = "idle" | "uploading" | "analyzing" | "done";

const STEPS = [
  { id: 1, text: "Fayl o'qilmoqda..." },
  { id: 2, text: "Mavzular aniqlanmoqda..." },
  { id: 3, text: "Asosiy tushunchalar ajratilmoqda..." },
  { id: 4, text: "Dars rejasi tuzilmoqda..." },
  { id: 5, text: "Test savollari yaratilmoqda..." },
];

const MOCK_RESULT = {
  title: "Algoritmlar va Ma'lumotlar Tuzilmasi",
  subject: "Informatika",
  level: "Bakalavr",
  topics: [
    { title: "Asosiy tushunchalar", subtopics: ["Kirish", "Ta'riflar", "Misollar"], difficulty: "easy" },
    { title: "Saralash algoritmlari", subtopics: ["Bubble Sort", "Quick Sort", "Merge Sort"], difficulty: "medium" },
    { title: "Qidiruv algoritmlari", subtopics: ["Linear Search", "Binary Search"], difficulty: "medium" },
    { title: "Ma'lumotlar tuzilmasi", subtopics: ["Stack", "Queue", "Linked List", "Tree"], difficulty: "hard" },
  ],
  lessons_suggested: 4,
  wow_facts: ["Birinchi algoritm Ada Lovelace tomonidan 1843-yilda yozilgan!", "Google har kuni 8.5 milliard qidiruvni qayta ishlaydi"],
  quiz_topics: ["Saralash", "Qidiruv", "Stack va Queue", "Murakkablik"],
};

export default function MaterialsPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setStage("uploading");
    setCompletedSteps([]);
    setProgress(0);

    // Simulate upload then analysis
    setTimeout(() => {
      setStage("analyzing");
      let step = 0;
      const iv = setInterval(() => {
        step++;
        setCompletedSteps((prev) => [...prev, step]);
        setProgress(step * 20);
        if (step >= 5) {
          clearInterval(iv);
          setTimeout(() => {
            setResult(MOCK_RESULT);
            setStage("done");
          }, 500);
        }
      }, 700);
    }, 1000);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="orb orb-1" /><div className="orb orb-2" />

      {/* Nav */}
      <nav className="glass" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/professor/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "white" }}>
            <span style={{ fontSize: "1.5rem" }}>🎓</span>
            <span className="gradient-text" style={{ fontWeight: 700 }}>Lectio AI</span>
            <span style={{ fontSize: "0.75rem", background: "rgba(245,166,35,0.2)", color: "var(--saffron)", padding: "2px 8px", borderRadius: 999 }}>Professor</span>
          </Link>
          <Link href="/professor/dashboard" className="btn-secondary" style={{ fontSize: "0.875rem", padding: "8px 16px", textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <div className="slide-up">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", marginBottom: 8 }}>
            📄 Metodichka <span className="gradient-text">Yuklash</span>
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: 32 }}>
            PDF, Word, PowerPoint yuklang — AI tahlil qiladi va dars yaratadi
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* IDLE — Dropzone */}
          {stage === "idle" && (
            <motion.div key="drop" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={`dropzone ${dragActive ? "active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}>
              <div style={{ fontSize: "3rem", marginBottom: 8 }}>📤</div>
              <h3>Metodichkani shu yerga tashlang</h3>
              <p>PDF, Word, PowerPoint, TXT — 50MB gacha</p>
              <label className="browse-btn" style={{ display: "inline-block", marginTop: 16 }}>
                Fayl tanlash
                <input type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileInput} style={{ display: "none" }} />
              </label>
            </motion.div>
          )}

          {/* ANALYZING */}
          {(stage === "uploading" || stage === "analyzing") && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card" style={{ padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: "1.5rem" }}>📄</span>
                <span style={{ fontWeight: 600 }}>{fileName}</span>
              </div>
              <div className="progress-track">
                <motion.div className="progress-fill" initial={{ width: "0%" }} animate={{ width: `${progress}%` }} />
              </div>
              <div style={{ marginTop: 20 }}>
                {STEPS.map((step, i) => (
                  <motion.div key={step.id} className={`step-item ${completedSteps.includes(step.id) ? "done" : ""}`}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <span style={{ fontSize: "1rem" }}>{completedSteps.includes(step.id) ? "✅" : "⏳"}</span>
                    <span>{step.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* DONE — Results */}
          {stage === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              {/* Success header */}
              <div className="glass-card" style={{ padding: 32, textAlign: "center", marginBottom: 24 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ fontSize: "3rem", marginBottom: 12 }}>✅</motion.div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>Metodichka tahlil qilindi!</h2>
                <p style={{ color: "var(--muted)", marginTop: 4 }}>{result.title}</p>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Fan", value: result.subject, icon: "📚" },
                  { label: "Daraja", value: result.level, icon: "🎓" },
                  { label: "Darslar", value: `${result.lessons_suggested} ta`, icon: "📖" },
                ].map((item) => (
                  <div key={item.label} className="glass-card" style={{ padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700 }}>{item.value}</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Topics */}
              <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>📋 Mavzular</h3>
                {result.topics.map((topic, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{topic.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{topic.subtopics.join(", ")}</div>
                    </div>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 999,
                      background: topic.difficulty === "easy" ? "rgba(13,147,115,0.2)" : topic.difficulty === "medium" ? "rgba(245,166,35,0.2)" : "rgba(232,72,85,0.2)",
                      color: topic.difficulty === "easy" ? "var(--jade)" : topic.difficulty === "medium" ? "var(--saffron)" : "var(--coral)" }}>
                      {topic.difficulty}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* WOW Facts */}
              <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>💡 Qiziqarli faktlar</h3>
                {result.wow_facts.map((fact, i) => (
                  <div key={i} style={{ padding: "8px 12px", color: "var(--saffron)", fontSize: "0.9rem", marginBottom: 4 }}>
                    ⚡ {fact}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Link href="/professor/create-lesson" className="join-btn" style={{ textAlign: "center", textDecoration: "none" }}>
                  ✨ Dars Yaratish
                </Link>
                <Link href="/professor/quiz" className="btn-secondary" style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🎮 Test Yaratish
                </Link>
              </div>

              <button onClick={() => { setStage("idle"); setResult(null); }}
                style={{ width: "100%", marginTop: 12, padding: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "var(--muted)", cursor: "pointer" }}>
                + Boshqa metodichka yuklash
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
