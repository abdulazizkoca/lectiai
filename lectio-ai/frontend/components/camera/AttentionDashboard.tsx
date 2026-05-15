"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Eye, Smartphone, MessageCircle, Brain } from "lucide-react";

interface AttentionMetrics {
  total: number;
  attentive_pct: number;
  distracted_pct: number;
  phone_pct: number;
  talking_pct: number;
  confused_pct: number;
  hand_raised: number;
  attention_score: number;
}

export function AttentionDashboard({ sessionId }: {
  sessionId: number;
}) {
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState<AttentionMetrics | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [history, setHistory] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      
      // WebSocket ulanish
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      const ws = new WebSocket(`${wsUrl}/ws/camera/${sessionId}`);
      wsRef.current = ws;
      
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.metrics) {
          setMetrics(data.metrics);
          setHistory(prev => [...prev.slice(-30), data.metrics.attention_score]);
        }
        if (data.suggestion) setSuggestion(data.suggestion);
      };
      
      setIsActive(true);
      
      // Har 2 soniyada frame yuborish
      intervalRef.current = setInterval(() => sendFrame(), 2000);
      
    } catch (err: any) {
      console.error("Kamera xatosi:", err);
      if (err.name === "NotAllowedError" || err.message.includes("Permission denied")) {
        alert("Kameraga ruxsat berilmadi! Iltimos, brauzer sozlamalaridan kameraga ruxsat bering va sahifani yangilang.");
      } else if (err.name === "NotFoundError") {
        alert("Kamera qurilmasi topilmadi. Kompyuteringizga kamera ulanganligini tekshiring.");
      } else {
        alert("Kamerani yoqishda xatolik: " + err.message);
      }
      setIsActive(false);
    }
  };

  const sendFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !wsRef.current) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = 640;
    canvas.height = 360;
    ctx.drawImage(video, 0, 0, 640, 360);
    
    canvas.toBlob((blob) => {
      if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
        blob.arrayBuffer().then(buf => {
          wsRef.current!.send(buf);
        });
      }
    }, "image/jpeg", 0.7);
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setMetrics(null);
  };

  // Attention score rangi
  const getAttentionColor = (score: number) => {
    if (score >= 75) return "#0D9373";
    if (score >= 50) return "#F5A623";
    return "#E84855";
  };

  const getAttentionLabel = (score: number) => {
    if (score >= 75) return "Zo'r";
    if (score >= 50) return "O'rtacha";
    return "Past";
  };

  return (
    <div className="attention-dashboard">
      
      {/* Kamera toggle */}
      <div className="camera-header">
        <h3>📷 Sinf Monitoringi</h3>
        <button
          onClick={isActive ? stopCamera : startCamera}
          className={`camera-toggle ${isActive ? "active" : ""}`}
        >
          {isActive ? <CameraOff size={18} /> : <Camera size={18} />}
          {isActive ? "O'chirish" : "Yoqish"}
        </button>
      </div>

      {/* Yashirin kamera elementi */}
      <video ref={videoRef} autoPlay muted playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <AnimatePresence>
        {isActive && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="metrics-panel"
          >
            
            {/* Asosiy Score */}
            <div className="attention-score-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1E1E28" strokeWidth="10"/>
                <motion.circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={getAttentionColor(metrics.attention_score)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - metrics.attention_score / 100)}`}
                  style={{ transformOrigin: "center", rotate: "-90deg" }}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 50 * (1 - metrics.attention_score / 100)}` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="score-center">
                <span className="score-number">{metrics.attention_score}%</span>
                <span className="score-label">{getAttentionLabel(metrics.attention_score)}</span>
              </div>
            </div>

            {/* Metrikalar */}
            <div className="metrics-grid">
              <MetricCard
                icon={<Eye size={16} />}
                label="Diqqatli"
                value={metrics.attentive_pct}
                color="#0D9373"
              />
              <MetricCard
                icon={<Smartphone size={16} />}
                label="Telefonda"
                value={metrics.phone_pct}
                color="#E84855"
                warning={metrics.phone_pct > 20}
              />
              <MetricCard
                icon={<MessageCircle size={16} />}
                label="Gaplashmoqda"
                value={metrics.talking_pct}
                color="#F5A623"
              />
              <MetricCard
                icon={<Brain size={16} />}
                label="Chalkashgan"
                value={metrics.confused_pct}
                color="#7B2FBE"
              />
            </div>

            {/* Qo'l ko'targanlar */}
            {metrics.hand_raised > 0 && (
              <motion.div
                className="hand-raised-alert"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                ✋ {metrics.hand_raised} kishi qo&apos;l ko&apos;tardi!
              </motion.div>
            )}

            {/* Mini grafik — attention tarixi */}
            <div className="attention-history">
              {history.map((val, i) => (
                <motion.div
                  key={i}
                  className="history-bar"
                  style={{
                    height: `${val}%`,
                    background: getAttentionColor(val),
                    opacity: 0.3 + (i / history.length) * 0.7
                  }}
                />
              ))}
            </div>

            {/* AI tavsiya */}
            {suggestion && (
              <motion.div
                className="ai-suggestion"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={suggestion}
              >
                <span className="suggestion-icon">💡</span>
                <p>{suggestion}</p>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ icon, label, value, color, warning = false }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  warning?: boolean;
}) {
  return (
    <motion.div
      className={`metric-card ${warning ? "warning-pulse" : ""}`}
      animate={warning ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: warning ? Infinity : 0, duration: 1.5 }}
    >
      <div className="metric-icon" style={{ color }}>{icon}</div>
      <div className="metric-bar-track">
        <motion.div
          className="metric-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <span className="metric-value">{value}%</span>
      <span className="metric-label">{label}</span>
    </motion.div>
  );
}
