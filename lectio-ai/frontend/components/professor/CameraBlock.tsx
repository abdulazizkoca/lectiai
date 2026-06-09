"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Camera, CameraOff, Eye, Gauge, Users } from "lucide-react";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const DETECT_WIDTH = 640;
const DETECT_HEIGHT = 480;
const MAX_CLASS_FACES = 32;
const DETECT_INTERVAL_MS = 75;
const FACE_HOLD_MS = 720;

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
  fps: number;
  x: string;
  y: string;
  w: string;
  h: string;
  conf: string;
  model: string;
}

const emptyStats: ClassroomStats = {
  students: 0,
  avgAttention: 0,
  engaged: 0,
  softWarn: 0,
  distracted: 0,
  dets: 0,
  latency: 0,
  fps: 0,
  x: "---",
  y: "---",
  w: "---",
  h: "---",
  conf: "---",
  model: "Kutilyapti",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  const pad = Math.max(10, Math.min(24, face.w * 0.13));
  const x = clamp(face.x - pad, 0, CANVAS_WIDTH - 2);
  const y = clamp(face.y - pad, 0, CANVAS_HEIGHT - 2);
  const w = clamp(face.w + pad * 2, 2, CANVAS_WIDTH - x);
  const h = clamp(face.h + pad * 2, 2, CANVAS_HEIGHT - y);
  const corner = Math.max(24, Math.min(50, w * 0.2));

  ctx.save();
  ctx.fillStyle = `${color}1f`;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([8, 5]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
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

  const centerX = x + w / 2;
  const centerY = y + h / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(centerX - 12, centerY);
  ctx.lineTo(centerX + 12, centerY);
  ctx.moveTo(centerX, centerY - 12);
  ctx.lineTo(centerX, centerY + 12);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const labelWidth = Math.max(210, w);
  ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
  ctx.fillRect(x, Math.max(0, y - 40), labelWidth, 34);
  ctx.fillStyle = color;
  ctx.font = '800 15px "Inter", system-ui, sans-serif';
  ctx.fillText(`TALABA ${String(face.id).padStart(2, "0")}`, x + 10, Math.max(24, y - 17));
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(face.attention)}%`, x + labelWidth - 10, Math.max(24, y - 17));
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
  ctx.fillRect(x, y + h + 8, labelWidth, 24);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = '700 12px "Inter", system-ui, sans-serif';
  ctx.fillText(`conf ${Math.round(face.conf * 100)}% | x ${Math.round(face.x)} y ${Math.round(face.y)} w ${Math.round(face.w)} h ${Math.round(face.h)}`, x + 10, y + h + 25);
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, stats: ClassroomStats) {
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.76)";
  ctx.fillRect(18, 18, 500, 88);
  ctx.fillStyle = "#f8fafc";
  ctx.font = '800 23px "Inter", system-ui, sans-serif';
  ctx.fillText(`${stats.students} yuz | ${stats.avgAttention}% o'rtacha diqqat`, 34, 50);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = '600 14px "Inter", system-ui, sans-serif';
  ctx.fillText(`FPS ${stats.fps || "--"} | Detect ${stats.latency}ms | ${stats.model}`, 34, 76);
  ctx.fillStyle = "#f5a623";
  ctx.fillText(`Faol: ${stats.engaged} | Kuzatuv: ${stats.softWarn} | Chalg'igan: ${stats.distracted}`, 34, 98);
  ctx.restore();
}

function drawAttentionWarning(ctx: CanvasRenderingContext2D, stats: ClassroomStats) {
  if (stats.students === 0 || stats.avgAttention >= 50) return;
  const pulse = Math.sin(Date.now() / 180) * 0.35 + 0.65;
  ctx.save();
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.16 + pulse * 0.16})`;
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = `rgba(239, 68, 68, ${0.78 + pulse * 0.12})`;
  ctx.fillRect(CANVAS_WIDTH - 360, 18, 342, 74);
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 14px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("DIQQAT PAST", CANVAS_WIDTH - 189, 48);
  ctx.font = '600 12px "Inter", system-ui, sans-serif';
  ctx.fillText(`${stats.distracted} talaba chalg'igan`, CANVAS_WIDTH - 189, 70);
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
  const isOnRef = useRef(false);

  const [isOn, setIsOn] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<ClassroomStats>(emptyStats);

  const [aiSettings, setAiSettings] = useState({
    aiSensitivity: "medium",
    phoneTracking: true,
    lowAttentionAlert: true,
    distractionTimeout: 5,
  });

  const aiSettingsRef = useRef(aiSettings);
  useEffect(() => {
    aiSettingsRef.current = aiSettings;
  }, [aiSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("lectio_professor_settings");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setAiSettings({
        aiSensitivity: parsed.aiSensitivity || "medium",
        phoneTracking: parsed.phoneTracking !== undefined ? parsed.phoneTracking : true,
        lowAttentionAlert: parsed.lowAttentionAlert !== undefined ? parsed.lowAttentionAlert : true,
        distractionTimeout: parsed.distractionTimeout !== undefined ? parsed.distractionTimeout : 5,
      });
    } catch {}
  }, [isOn]);

  const publishStats = useCallback((next: ClassroomStats) => {
    statsRef.current = next;
    const now = performance.now();
    if (now - uiTickRef.current > 180) {
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
      statsRef.current = { ...statsRef.current, fps: fp.value };
    }

    ctx.save();
    ctx.translate(CANVAS_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
    ctx.fillStyle = "rgba(2, 6, 23, 0.10)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const liveFaces = facesRef.current.filter((face) => performance.now() - face.lastSeen < FACE_HOLD_MS);
    facesRef.current = liveFaces;
    sortFaces(liveFaces).forEach((face) => drawFaceBox(ctx, face));
    drawHud(ctx, statsRef.current);

    if (aiSettingsRef.current.lowAttentionAlert) {
      drawAttentionWarning(ctx, statsRef.current);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const onResults = useCallback((results: any) => {
    const now = performance.now();
    const detections: any[] = (results?.detections ?? []).slice(0, MAX_CLASS_FACES);
    const sensitivity = aiSettingsRef.current.aiSensitivity;
    const redThreshold = sensitivity === "high" ? 55 : sensitivity === "low" ? 35 : 45;
    const yellowThreshold = sensitivity === "high" ? 78 : sensitivity === "low" ? 60 : 70;

    const mapped = detections.map((detection, index) => {
      const bb = detection.boundingBox;
      const conf = detection.score?.[0] ?? 0.9;
      const rawX = bb.xCenter - bb.width / 2;
      const mirroredBoxX = 1 - rawX - bb.width;
      const box = {
        x: mirroredBoxX * CANVAS_WIDTH,
        y: (bb.yCenter - bb.height / 2) * CANVAS_HEIGHT,
        w: bb.width * CANVAS_WIDTH,
        h: bb.height * CANVAS_HEIGHT,
      };

      const rawAttention = estimateAttention(conf, box);
      const attention = sensitivity === "low"
        ? Math.min(100, rawAttention + 8)
        : sensitivity === "high"
          ? Math.max(0, rawAttention - 8)
          : rawAttention;

      const status: FaceStatus = attention < redThreshold ? "red" : attention < yellowThreshold ? "yellow" : "green";

      return {
        id: index + 1,
        ...box,
        conf,
        attention,
        status,
        lastSeen: now,
      };
    });

    const sorted = sortFaces(mapped).map((face, index) => ({ ...face, id: index + 1 }));
    facesRef.current = sorted;
    const avgAttention = sorted.length ? Math.round(sorted.reduce((sum, face) => sum + face.attention, 0) / sorted.length) : 0;
    const first = sorted[0];

    publishStats({
      students: sorted.length,
      avgAttention,
      engaged: sorted.filter((face) => face.status === "green").length,
      softWarn: sorted.filter((face) => face.status === "yellow").length,
      distracted: sorted.filter((face) => face.status === "red").length,
      dets: statsRef.current.dets + 1,
      latency: statsRef.current.latency,
      fps: statsRef.current.fps,
      x: first ? String(Math.round(first.x)) : "---",
      y: first ? String(Math.round(first.y)) : "---",
      w: first ? String(Math.round(first.w)) : "---",
      h: first ? String(Math.round(first.h)) : "---",
      conf: first ? `${Math.round(first.conf * 100)}%` : "---",
      model: "FaceDetection fallback",
    });
  }, [publishStats]);

  const loadLegacyScripts = useCallback(async () => {
    if ((window as any).FaceDetection && (window as any).Camera) return;
    const load = (src: string) => new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Script yuklanmadi: ${src}`));
      document.body.appendChild(script);
    });

    await load("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
    await load("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
  }, []);

  const startLegacyDetector = useCallback(async () => {
    await loadLegacyScripts();
    if (!videoRef.current || !isOnRef.current) return;

    const FaceDetection = (window as any).FaceDetection;
    detRef.current = new FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
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
    publishStats({ ...statsRef.current, model: "FaceDetection fallback", label: "Detektor faol" } as ClassroomStats);
  }, [loadLegacyScripts, onResults, publishStats]);

  const activate = useCallback(async () => {
    setError("");
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

      isOnRef.current = true;
      setIsOn(true);
      publishStats({ ...emptyStats, model: "FaceDetection yuklanmoqda" });
      rafRef.current = requestAnimationFrame(renderLoop);
      await startLegacyDetector();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kamerani yoqib bo'lmadi");
      console.error("Camera activation failed", err);
    }
  }, [publishStats, renderLoop, startLegacyDetector]);

  const deactivate = useCallback(() => {
    isOnRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (camRef.current) {
      try { camRef.current.stop?.(); } catch {}
      camRef.current = null;
    }
    if (detRef.current) {
      try { detRef.current.close?.(); } catch {}
      detRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      try {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      } catch {}
      videoRef.current.srcObject = null;
    }
    facesRef.current = [];
    statsRef.current = emptyStats;
    setStats(emptyStats);
    setError("");
    setIsOn(false);
  }, []);

  useEffect(() => () => deactivate(), [deactivate]);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-slate-900/50 backdrop-blur-md text-slate-800 dark:text-slate-100 shadow-xl shadow-black/10 dark:shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          {isOn ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#0D9373]">
              <span className="w-2 h-2 rounded-full bg-[#0D9373] animate-pulse" />
              Kamera Faol · {stats.students} yuz · {stats.avgAttention}% diqqat
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-800 dark:text-white">AI Diqqat Kuzatuvi</span>
          )}
        </div>
        <button
          onClick={isOn ? deactivate : activate}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${isOn ? "bg-[#E84855]/20 text-[#E84855] border border-[#E84855]/30 hover:bg-[#E84855] hover:text-white" : "bg-[#F5A623] text-black hover:bg-[#e8941a]"}`}
        >
          {isOn ? <CameraOff size={14} /> : <Camera size={14} />}
          {isOn ? "O'chirish" : "Yoqish"}
        </button>
      </div>

      <div className="relative aspect-video bg-black">
        <video ref={videoRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0" muted playsInline />
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block h-full w-full" />

        {!isOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100/98 dark:bg-slate-950/95 text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] border border-[#F5A623]/20">
              <Camera size={28} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-white">Kamera o&apos;chirilgan</p>
              <p className="mt-1 text-xs text-slate-500">Yuzlar va diqqatni kuzatish uchun yoqing</p>
            </div>
            <button onClick={activate} className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#e8941a] active:scale-95 transition-all">
              <Camera size={15} /> Kamerani Yoqish
            </button>
          </div>
        )}

        {isOn && stats.students === 0 && !error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-[#0d1320]/90 px-4 py-2 text-sm font-semibold text-[#f5a623]">
            Yuzlar qidirilmoqda...
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl border border-red-500/30 bg-red-950/85 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-px bg-black/8 dark:bg-white/10 grid-cols-3">
        <StatCard icon={<Users size={16} />} label="Yuzlar" value={String(stats.students)}
          hint={`${stats.engaged}✓ ${stats.softWarn}⚡ ${stats.distracted}✗`}
          color={stats.students > 0 ? "#0D9373" : undefined} />
        <StatCard icon={<Gauge size={16} />} label="Diqqat" value={stats.students > 0 ? `${stats.avgAttention}%` : "—"}
          hint={stats.students > 0 ? (stats.avgAttention >= 70 ? "Yaxshi" : stats.avgAttention >= 50 ? "O'rta" : "Past diqqat") : "Kamera off"}
          color={stats.students > 0 ? (stats.avgAttention >= 70 ? "#0D9373" : stats.avgAttention >= 50 ? "#F5A623" : "#E84855") : undefined} />
        <StatCard icon={<Activity size={16} />} label="Status" value={isOn ? "Faol" : "Off"}
          hint={isOn ? `${stats.fps || "--"} FPS` : "Kamerani yoqing"}
          color={isOn ? "#F5A623" : undefined} />
      </div>
    </section>
  );
});

function StatCard({ icon, label, value, hint, color }: { icon: React.ReactNode; label: string; value: string; hint: string; color?: string }) {
  return (
    <div className="bg-slate-100/80 dark:bg-slate-950/40 p-3 backdrop-blur-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <span style={{ color: color || "#F5A623" }}>{icon}</span>
        {label}
      </div>
      <div className="truncate text-lg font-black text-slate-800 dark:text-white" style={color ? { color } : undefined}>{value}</div>
      <div className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">{hint}</div>
    </div>
  );
}
