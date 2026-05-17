"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Camera, CameraOff, Gauge, Users } from "lucide-react";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const DETECT_WIDTH = 640;
const DETECT_HEIGHT = 480;
const MAX_CLASS_FACES = 32;
const DETECT_INTERVAL_MS = 85;
const FACE_HOLD_MS = 650;

type FaceStatus = "green" | "yellow" | "red";

interface FaceBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
  attention: number;
  status: FaceStatus;
  lastSeen: number;
}

interface ClassroomStats {
  students: number;
  avgAttention: number;
  engaged: number;
  softWarn: number;
  distracted: number;
  dets: number;
  latency: number;
  x: string;
  y: string;
  w: string;
  h: string;
  conf: string;
}

const emptyStats: ClassroomStats = {
  students: 0,
  avgAttention: 0,
  engaged: 0,
  softWarn: 0,
  distracted: 0,
  dets: 0,
  latency: 0,
  x: "---",
  y: "---",
  w: "---",
  h: "---",
  conf: "---",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getStatus = (attention: number): FaceStatus => {
  if (attention < 45) return "red";
  if (attention < 70) return "yellow";
  return "green";
};

const statusColor = (status: FaceStatus) => {
  if (status === "green") return "#22c55e";
  if (status === "yellow") return "#f5a623";
  return "#ef4444";
};

const estimateAttention = (conf: number, box: Pick<FaceBox, "x" | "y" | "w" | "h">) => {
  const faceArea = box.w * box.h;
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  const centerDistance = Math.hypot(centerX - CANVAS_WIDTH / 2, centerY - CANVAS_HEIGHT / 2);
  const centerScore = 100 - clamp((centerDistance / (CANVAS_WIDTH * 0.65)) * 100, 0, 42);
  const visibilityScore = clamp(faceArea / 850, 20, 100);
  return Math.round(clamp(conf * 58 + centerScore * 0.24 + visibilityScore * 0.18, 0, 100));
};

const sortFaces = (faces: FaceBox[]) =>
  [...faces].sort((a, b) => {
    const rowA = Math.round((a.y + a.h / 2) / 120);
    const rowB = Math.round((b.y + b.h / 2) / 120);
    if (rowA !== rowB) return rowA - rowB;
    return a.x - b.x;
  });

function drawFaceBox(ctx: CanvasRenderingContext2D, face: FaceBox) {
  const color = statusColor(face.status);
  const pad = Math.max(10, Math.min(20, face.w * 0.12));
  const x = clamp(face.x - pad, 0, CANVAS_WIDTH - 2);
  const y = clamp(face.y - pad, 0, CANVAS_HEIGHT - 2);
  const w = clamp(face.w + pad * 2, 2, CANVAS_WIDTH - x);
  const h = clamp(face.h + pad * 2, 2, CANVAS_HEIGHT - y);
  const corner = Math.max(22, Math.min(42, w * 0.2));

  ctx.save();
  ctx.fillStyle = `${color}1f`;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.38;
  ctx.setLineDash([7, 5]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * corner, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * corner);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(2, 6, 23, 0.78)";
  ctx.fillRect(x, Math.max(0, y - 36), Math.max(154, w), 32);
  ctx.fillStyle = color;
  ctx.font = '700 16px "Inter", system-ui, sans-serif';
  ctx.fillText(`TARGET ${String(face.id).padStart(2, "0")}`, x + 8, Math.max(22, y - 14));
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(face.conf * 100)}%`, x + Math.max(146, w) - 8, Math.max(22, y - 14));
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(2, 6, 23, 0.78)";
  ctx.fillRect(x, y + h + 6, w, 20);
  ctx.fillStyle = color;
  ctx.font = '600 12px "Inter", system-ui, sans-serif';
  ctx.fillText(`x:${Math.round(face.x)} y:${Math.round(face.y)} w:${Math.round(face.w)} h:${Math.round(face.h)}`, x + 8, y + h + 21);
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, fps: number, stats: ClassroomStats) {
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.76)";
  ctx.fillRect(18, 18, 410, 68);
  ctx.fillStyle = "#f8fafc";
  ctx.font = '800 22px "Inter", system-ui, sans-serif';
  ctx.fillText(`${stats.students} o'quvchi aniqlandi`, 34, 47);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = '600 15px "Inter", system-ui, sans-serif';
  ctx.fillText(`Diqqat: ${stats.avgAttention}%  |  FPS: ${fps || "--"}  |  Detect: ${stats.latency}ms`, 34, 73);
  ctx.restore();
}

function drawAttentionWarning(ctx: CanvasRenderingContext2D) {
  const pulse = Math.sin(Date.now() / 180) * 0.4 + 0.6; // elegant blinking pulse
  ctx.save();
  // Glow effect on screen margins
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.15 + pulse * 0.15})`;
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Warning Box in upper right corner
  ctx.fillStyle = `rgba(239, 68, 68, ${0.75 + pulse * 0.15})`;
  ctx.fillRect(CANVAS_WIDTH - 348, 18, 330, 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 14px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("⚠️ DIQQAT JUDA PAST", CANVAS_WIDTH - 348 + 165, 46);
  ctx.font = '500 11px "Inter", system-ui, sans-serif';
  ctx.fillText("TALABALAR FAOLIYATIDAN CHALG'IMOQDA", CANVAS_WIDTH - 348 + 165, 66);
  ctx.restore();
}

export const CameraBlock = React.memo(function CameraBlock({ sessionId }: { sessionId: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const detRef = useRef<any>(null);
  const camRef = useRef<any>(null);
  const facesRef = useRef<FaceBox[]>([]);
  const statsRef = useRef<ClassroomStats>(emptyStats);
  const fpsRef = useRef({ frames: 0, last: Date.now(), value: 0 });
  const lastDetectRef = useRef(0);
  const detectingRef = useRef(false);
  const uiTickRef = useRef(0);

  const [isOn, setIsOn] = useState(false);
  const [stats, setStats] = useState<ClassroomStats>(emptyStats);
  const [fpsDisplay, setFpsDisplay] = useState(0);

  const [aiSettings, setAiSettings] = useState({
    aiSensitivity: "medium",
    phoneTracking: true,
    lowAttentionAlert: true,
    distractionTimeout: 5
  });

  const aiSettingsRef = useRef(aiSettings);
  useEffect(() => {
    aiSettingsRef.current = aiSettings;
  }, [aiSettings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lectio_professor_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAiSettings({
            aiSensitivity: parsed.aiSensitivity || "medium",
            phoneTracking: parsed.phoneTracking !== undefined ? parsed.phoneTracking : true,
            lowAttentionAlert: parsed.lowAttentionAlert !== undefined ? parsed.lowAttentionAlert : true,
            distractionTimeout: parsed.distractionTimeout !== undefined ? parsed.distractionTimeout : 5
          });
        } catch (e) {}
      }
    }
  }, [isOn]);

  const publishStats = useCallback((next: ClassroomStats) => {
    statsRef.current = next;
    const now = performance.now();
    if (now - uiTickRef.current > 220) {
      uiTickRef.current = now;
      setStats(next);
    }
  }, []);

  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!video || !canvas || !ctx) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const fp = fpsRef.current;
    fp.frames += 1;
    const now = Date.now();
    if (now - fp.last >= 1000) {
      fp.value = Math.round((fp.frames * 1000) / (now - fp.last));
      fp.frames = 0;
      fp.last = now;
      setFpsDisplay(fp.value);
    }

    ctx.save();
    ctx.translate(CANVAS_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
    ctx.fillStyle = "rgba(2, 6, 23, 0.12)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const liveFaces = facesRef.current.filter((face) => performance.now() - face.lastSeen < FACE_HOLD_MS);
    facesRef.current = liveFaces;
    sortFaces(liveFaces).forEach((face) => drawFaceBox(ctx, face));
    drawHud(ctx, fp.value, statsRef.current);

    if (aiSettingsRef.current.lowAttentionAlert && statsRef.current.avgAttention < 50 && statsRef.current.students > 0) {
      drawAttentionWarning(ctx);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const onResults = useCallback((results: any) => {
    const now = performance.now();
    const detections: any[] = (results?.detections ?? []).slice(0, MAX_CLASS_FACES);
    
    const sensitivity = aiSettingsRef.current.aiSensitivity;
    let redThreshold = 45;
    let yellowThreshold = 70;
    if (sensitivity === "low") {
      redThreshold = 35;
      yellowThreshold = 60;
    } else if (sensitivity === "high") {
      redThreshold = 55;
      yellowThreshold = 78;
    }

    const mapped = detections.map((detection, index) => {
      const bb = detection.boundingBox;
      const conf = detection.score?.[0] ?? 0.9;
      const rawX = bb.xCenter - bb.width / 2;
      const mirroredX = 1 - rawX - bb.width;
      const box = {
        x: mirroredX * CANVAS_WIDTH,
        y: (bb.yCenter - bb.height / 2) * CANVAS_HEIGHT,
        w: bb.width * CANVAS_WIDTH,
        h: bb.height * CANVAS_HEIGHT,
      };
      
      const attentionRaw = estimateAttention(conf, box);
      let attention = attentionRaw;
      if (sensitivity === "low") {
        attention = Math.min(100, attentionRaw + 8);
      } else if (sensitivity === "high") {
        attention = Math.max(0, attentionRaw - 8);
      }

      const getStatusWithSensitivity = (att: number): FaceStatus => {
        if (att < redThreshold) return "red";
        if (att < yellowThreshold) return "yellow";
        return "green";
      };

      return {
        id: index + 1,
        ...box,
        conf,
        attention,
        status: getStatusWithSensitivity(attention),
        lastSeen: now,
      };
    });

    const sorted = sortFaces(mapped).map((face, index) => ({ ...face, id: index + 1 }));
    facesRef.current = sorted;
    const avgAttention = sorted.length ? Math.round(sorted.reduce((sum, face) => sum + face.attention, 0) / sorted.length) : 0;

    publishStats({
      students: sorted.length,
      avgAttention,
      engaged: sorted.filter((face) => face.status === "green").length,
      softWarn: sorted.filter((face) => face.status === "yellow").length,
      distracted: sorted.filter((face) => face.status === "red").length,
      dets: statsRef.current.dets + 1,
      latency: statsRef.current.latency,
      x: sorted[0] ? String(Math.round(sorted[0].x)) : "---",
      y: sorted[0] ? String(Math.round(sorted[0].y)) : "---",
      w: sorted[0] ? String(Math.round(sorted[0].w)) : "---",
      h: sorted[0] ? String(Math.round(sorted[0].h)) : "---",
      conf: sorted[0] ? `${Math.round(sorted[0].conf * 100)}%` : "---",
    });
  }, [publishStats]);

  const loadScripts = useCallback(async () => {
    if ((window as any).FaceDetection && (window as any).Camera) return;
    const load = (src: string) => new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
    await load("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
    await load("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
  }, []);

  const activate = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: CANVAS_WIDTH },
          height: { ideal: CANVAS_HEIGHT },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setIsOn(true);
      rafRef.current = requestAnimationFrame(renderLoop);
      await loadScripts();

      const FaceDetection = (window as any).FaceDetection;
      detRef.current = new FaceDetection({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}` });
      detRef.current.setOptions({ model: "short", minDetectionConfidence: 0.3 });
      detRef.current.onResults(onResults);

      camRef.current = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          const now = performance.now();
          if (!detRef.current || !videoRef.current || detectingRef.current || now - lastDetectRef.current < DETECT_INTERVAL_MS) return;
          detectingRef.current = true;
          lastDetectRef.current = now;
          const t0 = performance.now();
          try {
            await detRef.current.send({ image: videoRef.current });
            statsRef.current = { ...statsRef.current, latency: Math.round(performance.now() - t0) };
          } finally {
            detectingRef.current = false;
          }
        },
        width: DETECT_WIDTH,
        height: DETECT_HEIGHT,
      });

      camRef.current.start();
    } catch (error) {
      console.error("Camera activation failed", error);
    }
  }, [loadScripts, onResults, renderLoop]);

  const deactivate = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (camRef.current) {
      try { camRef.current.stop?.(); } catch (e) {}
      camRef.current = null;
    }
    if (detRef.current) {
      try { detRef.current.close?.(); } catch (e) {}
      detRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      try {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
    facesRef.current = [];
    statsRef.current = emptyStats;
    setStats(emptyStats);
    setIsOn(false);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (camRef.current) {
      try { camRef.current.stop?.(); } catch (e) {}
      camRef.current = null;
    }
    if (detRef.current) {
      try { detRef.current.close?.(); } catch (e) {}
      detRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      try {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl text-slate-100 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Diqqat Kuzatuvi</h3>
          <p className="text-xs text-slate-400">{sessionId ? `Jonli sessiya faol: ${sessionId}` : "Dars davomida talabalar faolligini kameradan nazorat qilish"}</p>
        </div>
        <button
          onClick={isOn ? deactivate : activate}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition active:scale-95 ${isOn ? "bg-[#E84855]/20 text-[#E84855] border border-[#E84855]/30 hover:bg-[#E84855] hover:text-white" : "bg-[#F5A623] text-black hover:bg-[#e8941a] shadow-lg shadow-[#F5A623]/20"}`}
        >
          {isOn ? <CameraOff size={16} /> : <Camera size={16} />}
          {isOn ? "O'chirish" : "Kamerani yoqish"}
        </button>
      </div>

      <div className="relative aspect-video bg-black">
        <video ref={videoRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0" muted playsInline />
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block h-full w-full" />

        {!isOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95 text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] mb-2 border border-[#F5A623]/20">
              <Camera size={32} />
            </div>
            <div>
              <p className="text-lg font-bold text-white font-display">Kamera Tizimi Tayyor</p>
              <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">Kamerani yoqish orqali AI yuz detektori va diqqat darajasini tahlil qilishni boshlang</p>
            </div>
            <button onClick={activate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#e8941a] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#F5A623]/20 hover:scale-105 active:scale-95 transition-all">
              <Camera size={16} />
              Kamerani Yoqish
            </button>
          </div>
        )}

        {isOn && stats.students === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-[#0d1320]/90 px-4 py-2 text-sm font-semibold text-[#f5a623]">
            Talabalar qidirilmoqda...
          </div>
        )}
      </div>

      <div className="grid gap-px bg-white/10 md:grid-cols-4">
        <StatCard icon={<Users size={18} />} label="O'quvchilar" value={String(stats.students)} hint={`${MAX_CLASS_FACES} tagacha yuz`} />
        <StatCard icon={<Gauge size={18} />} label="Diqqat" value={`${stats.avgAttention}%`} hint={`${stats.engaged} yaxshi, ${stats.softWarn} o'rta, ${stats.distracted} past`} />
        <StatCard icon={<Activity size={18} />} label="Tezlik" value={`${fpsDisplay || "--"} FPS`} hint={`detect ${stats.latency}ms`} />
        <StatCard icon={<Camera size={18} />} label="Detektor" value={stats.students > 0 ? "Faol" : "Kutilmoqda"} hint={stats.students > 0 ? `Ishonch: ${stats.conf}` : "AI talabalarni qidirmoqda"} />
      </div>
    </section>
  );
});

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="bg-slate-950/40 p-5 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
        <span className="text-[#F5A623]">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-300">{hint}</div>
    </div>
  );
}
