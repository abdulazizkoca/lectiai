"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ─── NEXUS VISION palette ──────────────────────────────────────────────────
const NX = {
  p:   "#00f5ff",
  s:   "#ff006e",
  a:   "#7fff00",
  bg:  "rgba(0,245,255,0.06)",
  dim: "rgba(0,245,255,0.35)",
};

function drawFaceBoxNexus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  conf: number, idx: number
) {
  const pad = 14;
  const bx = x - pad, by = y - pad;
  const bw = w + pad * 2, bh = h + pad * 2;
  const t  = Date.now() / 1000;
  const cl = 24;

  ctx.save();

  ctx.fillStyle = NX.bg;
  ctx.fillRect(bx, by, bw, bh);

  const pulse = (Math.sin(t * 3 + idx) + 1) / 2;
  ctx.strokeStyle = NX.p;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = pulse * 0.22;
  ctx.strokeRect(bx - pulse * 10, by - pulse * 10, bw + pulse * 20, bh + pulse * 20);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = NX.p;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.lineWidth   = 2.5;
  ctx.strokeStyle = NX.p;
  ctx.shadowColor = NX.p;
  ctx.shadowBlur  = 14;
  ([
    [bx,      by,      1,  1],
    [bx + bw, by,     -1,  1],
    [bx,      by + bh, 1, -1],
    [bx + bw, by + bh,-1, -1],
  ] as [number, number, number, number][]).forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cl, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cl);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  const scanY = by + ((t * 90) % bh);
  const sg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  sg.addColorStop(0,   "transparent");
  sg.addColorStop(0.5, NX.a + "88");
  sg.addColorStop(1,   "transparent");
  ctx.strokeStyle = sg;
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(bx, scanY);
  ctx.lineTo(bx + bw, scanY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const cxc = bx + bw / 2, cyc = by + bh / 2;
  const ch  = 10;
  ctx.strokeStyle = NX.s;
  ctx.lineWidth   = 1.2;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(cxc - ch, cyc); ctx.lineTo(cxc + ch, cyc);
  ctx.moveTo(cxc, cyc - ch); ctx.lineTo(cxc, cyc + ch);
  ctx.stroke();

  ctx.fillStyle   = NX.s;
  ctx.shadowColor = NX.s;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.arc(cxc, cyc, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 1;

  ctx.font      = '11px "Share Tech Mono", monospace';
  ctx.fillStyle = NX.p;
  ctx.textAlign = "left";
  ctx.fillText(`TARGET ${String(idx + 1).padStart(2, "0")}`, bx + 2, by - 5);

  ctx.fillStyle = NX.a;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(conf * 100)}%`, bx + bw - 2, by - 5);

  ctx.textAlign   = "left";
  ctx.fillStyle   = NX.p;
  ctx.globalAlpha = 0.6;
  ctx.fillText("FACE LOCKED ◎", bx + 2, by + bh + 12);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawScanReticle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const t  = Date.now() / 1000;
  const cx = w / 2, cy = h / 2;
  const r  = 60 + Math.sin(t * 2) * 14;

  ctx.save();
  ctx.strokeStyle = NX.p;
  ctx.lineWidth   = 1;
  ctx.globalAlpha = 0.15 + Math.sin(t * 3) * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.4;
  ctx.lineWidth   = 2;
  ([
    [0, 0.4], [0.55, 0.95], [1.1, 1.5], [1.65, 2.05],
  ] as [number, number][]).forEach(([s, e]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, (s + t * 0.4) * Math.PI, (e + t * 0.4) * Math.PI);
    ctx.stroke();
  });

  ctx.globalAlpha = 0.6;
  ctx.font        = '11px "Share Tech Mono", monospace';
  ctx.fillStyle   = NX.p;
  ctx.textAlign   = "center";
  ctx.fillText("SCANNING...", cx, cy + r + 18);
  ctx.textAlign   = "left";
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, fps: number) {
  ctx.save();
  ctx.strokeStyle = NX.p;
  ctx.lineWidth   = 0.5;
  ctx.globalAlpha = 0.12;
  for (let x = 0; x <= w; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0);   ctx.lineTo(x, 8);   ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, h);   ctx.lineTo(x, h-8); ctx.stroke();
  }
  for (let y = 0; y <= h; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y);   ctx.lineTo(8, y);   ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w, y);   ctx.lineTo(w-8, y); ctx.stroke();
  }

  ctx.globalAlpha = 0.4;
  ctx.fillStyle   = NX.p;
  ctx.font        = '9px "Share Tech Mono", monospace';
  ctx.textAlign   = "left";
  ctx.fillText(new Date().toTimeString().slice(0, 8), 8, h - 6);
  ctx.textAlign   = "right";
  ctx.fillText(`${fps} FPS`, w - 8, h - 6);
  ctx.fillStyle   = NX.a;
  ctx.globalAlpha = 0.45;
  ctx.fillText("[ NEXUS·VISION ]", w - 8, 14);
  ctx.textAlign   = "left";
  ctx.globalAlpha = 1;
  ctx.restore();
}

interface StudentCameraProps {
  sessionId?: string;
  onAttentionUpdate?: (score: number) => void;
  isPhoneAllowed?: boolean;
}

export default function StudentCamera({
  sessionId = "default",
  onAttentionUpdate,
  isPhoneAllowed = false,
}: StudentCameraProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const facesRef   = useRef<{ x:number; y:number; w:number; h:number; conf:number }[]>([]);
  const fpsRef     = useRef({ frames: 0, last: Date.now(), value: 0 });

  const [isEnabled,      setIsEnabled]      = useState(false);
  const [status,         setStatus]         = useState({ score: 100, color: "green", label: "Kutilyapti..." });
  const [snapshotFlash,  setSnapshotFlash]  = useState(false);
  const [faceCount,      setFaceCount]      = useState(0);
  const [faceStats,      setFaceStats]      = useState<{ x:number; y:number; w:number; h:number; score:number } | null>(null);
  const [hasFace,        setHasFace]        = useState(false);

  const faceDetectorRef = useRef<any>(null);
  const cameraRef       = useRef<any>(null);

  const takeSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 200);
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  }, []);

  const renderLoop = useCallback(() => {
    const canvas = overlayRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) { rafRef.current = requestAnimationFrame(renderLoop); return; }

    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(renderLoop); return; }

    const W = canvas.width;
    const H = canvas.height;

    const fp = fpsRef.current;
    fp.frames++;
    const now = Date.now();
    if (now - fp.last >= 1000) {
      fp.value  = Math.round((fp.frames * 1000) / (now - fp.last));
      fp.frames = 0;
      fp.last   = now;
    }

    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    const fs = facesRef.current;
    if (fs.length > 0) {
      fs.forEach((f, i) => drawFaceBoxNexus(ctx, f.x, f.y, f.w, f.h, f.conf, i));
    } else {
      drawScanReticle(ctx, W, H);
    }

    drawHUD(ctx, W, H, fp.value);

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const onResults = useCallback((results: any) => {
    const detections: any[] = results?.detections ?? [];

    if (detections.length === 0) {
      facesRef.current = [];
      setFaceCount(0);
      setFaceStats(null);
      setHasFace(false);
      setStatus({ score: 100, color: "yellow", label: "Kutilyapti..." });
      onAttentionUpdate?.(0);
      return;
    }

    const canvas = overlayRef.current;
    const W = canvas?.width  ?? 640;
    const H = canvas?.height ?? 480;

    facesRef.current = detections.map(det => {
      const bb    = det.boundingBox;
      const rawX  = bb.xCenter - bb.width / 2;
      const mirX  = 1 - rawX - bb.width;
      return {
        x:    mirX     * W,
        y:    (bb.yCenter - bb.height / 2) * H,
        w:    bb.width  * W,
        h:    bb.height * H,
        conf: det.score?.[0] ?? 0.9,
      };
    });

    const first = facesRef.current[0];
    const firstScore = Math.round(first.conf * 100);
    const statusColor = firstScore >= 70 ? "green" : firstScore >= 40 ? "yellow" : "red";

    setFaceCount(detections.length);
    setHasFace(true);
    setFaceStats({ x: Math.round(first.x), y: Math.round(first.y), w: Math.round(first.w), h: Math.round(first.h), score: firstScore });
    setStatus({ score: firstScore, color: statusColor, label: "Kuzatildi" });
    onAttentionUpdate?.(firstScore);
  }, [onAttentionUpdate]);

  const loadMediaPipeScripts = useCallback(async () => {
    if (typeof window === "undefined") return;
    if ((window as any).FaceDetection && (window as any).Camera) return;
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src; s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
  }, []);

  const initFaceDetector = useCallback(async () => {
    await loadMediaPipeScripts();
    if (!faceDetectorRef.current) {
      const FD = (window as any).FaceDetection;
      faceDetectorRef.current = new FD({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      faceDetectorRef.current.setOptions({ model: "short", minDetectionConfidence: 0.5 });
      faceDetectorRef.current.onResults(onResults);
    }
  }, [loadMediaPipeScripts, onResults]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cameraRef.current?.stop?.();
      faceDetectorRef.current?.close?.();
    };
  }, []);

  const toggleCamera = useCallback(async () => {
    if (isEnabled) {
      cancelAnimationFrame(rafRef.current);
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      cameraRef.current?.stop?.();
      facesRef.current = [];
      setIsEnabled(false);
      setFaceCount(0);
      setFaceStats(null);
      setHasFace(false);
      const canvas = overlayRef.current;
      if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          await initFaceDetector();
          if ((window as any).Camera) {
            cameraRef.current = new (window as any).Camera(videoRef.current, {
              onFrame: async () => {
                if (faceDetectorRef.current && videoRef.current) {
                  await faceDetectorRef.current.send({ image: videoRef.current });
                }
              },
              width: 640,
              height: 480,
            });
            cameraRef.current.start();
          }
          rafRef.current = requestAnimationFrame(renderLoop);
          setIsEnabled(true);
        }
      } catch (e) {
        console.error("Camera access denied", e);
      }
    }
  }, [isEnabled, initFaceDetector, renderLoop]);

  const getDotClass = () => {
    if (status.color === "green")  return "bg-[#0D9373] shadow-[0_0_10px_#0D9373]";
    if (status.color === "yellow") return "bg-[#F5A623] shadow-[0_0_10px_#F5A623]";
    return "bg-[#E84855] shadow-[0_0_10px_#E84855] animate-pulse";
  };

  return (
    <div className="student-camera-widget rounded-xl overflow-hidden mt-4">
      <div className={`px-3 py-2 border rounded-lg text-xs font-medium mb-2 ${isPhoneAllowed ? "bg-[#0D9373]/10 border-[#0D9373]/20 text-[#0D9373]" : "bg-[#E84855]/10 border-[#E84855]/20 text-[#E84855]"}`}>
        Telefon ishlatish: {isPhoneAllowed ? "Ruxsat berilgan" : "Taqiqlangan (Iltimos kamerani yoqing)"}
      </div>

      {isEnabled ? (
        <div
          className="relative mt-2 rounded-lg overflow-hidden"
          style={{
            minHeight: 300,
            background: "#020408",
            border: "1px solid rgba(0,245,255,0.2)",
            boxShadow: "0 0 24px rgba(0,245,255,0.08), inset 0 0 40px rgba(0,0,0,0.6)",
          }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
            muted
            playsInline
          />

          <canvas
            ref={overlayRef}
            width={640}
            height={480}
            className="w-full h-auto max-h-[300px] object-cover block"
            style={{ imageRendering: "pixelated" }}
          />

          {snapshotFlash && (
            <div className="absolute inset-0 bg-white/80 z-20 transition-opacity" />
          )}

          <div
            className="absolute top-3 left-3 z-20 text-[11px] leading-6"
            style={{
              background: "rgba(2,4,8,0.82)",
              border: "1px solid rgba(0,245,255,0.2)",
              padding: "10px 14px",
              backdropFilter: "blur(8px)",
              fontFamily: "'Share Tech Mono', monospace",
              color: "#00f5ff",
              letterSpacing: "1px",
            }}
          >
            {(["tl","tr","bl","br"] as const).map(c => (
              <span
                key={c}
                style={{
                  position: "absolute",
                  width: 10, height: 10,
                  ...(c.includes("t") ? { top: -1 } : { bottom: -1 }),
                  ...(c.includes("l") ? { left: -1 } : { right: -1 }),
                  borderTop:    c.includes("t") ? "2px solid #00f5ff" : undefined,
                  borderBottom: c.includes("b") ? "2px solid #00f5ff" : undefined,
                  borderLeft:   c.includes("l") ? "2px solid #00f5ff" : undefined,
                  borderRight:  c.includes("r") ? "2px solid #00f5ff" : undefined,
                  boxShadow: "0 0 6px #00f5ff",
                }}
              />
            ))}

            <div style={{ color: "#ff006e", fontSize: 9, letterSpacing: 3, marginBottom: 6 }}>▸ NEXUS·VISION TRACKER</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "rgba(0,245,255,0.55)" }}>FACES</span>
              <span style={{ color: "#7fff00", fontWeight: "bold" }}>{faceCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "rgba(0,245,255,0.55)" }}>CONF</span>
              <span style={{ color: "#7fff00", fontWeight: "bold" }}>{faceStats?.score ?? "--"}%</span>
            </div>
            {faceStats && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "rgba(0,245,255,0.55)" }}>X · Y</span>
                  <span style={{ color: "#7fff00" }}>{faceStats.x} · {faceStats.y}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "rgba(0,245,255,0.55)" }}>W · H</span>
                  <span style={{ color: "#7fff00" }}>{faceStats.w} · {faceStats.h}</span>
                </div>
              </>
            )}
          </div>

          {!hasFace && (
            <div
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-[11px] whitespace-nowrap animate-pulse"
              style={{
                color: "#ff006e",
                textShadow: "0 0 8px #ff006e",
                fontFamily: "'Share Tech Mono', monospace",
                letterSpacing: 2,
              }}
            >
              TARGET NOT DETECTED - SCANNING...
            </div>
          )}

          <div
            className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between rounded px-3 py-1.5"
            style={{
              background: "rgba(2,4,8,0.78)",
              border: "1px solid rgba(0,245,255,0.15)",
              backdropFilter: "blur(8px)",
              fontFamily: "'Share Tech Mono', monospace",
            }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${getDotClass()}`} />
              <span className="text-[11px]" style={{ color: "#00f5ff", letterSpacing: 2 }}>{status.label.toUpperCase()}</span>
            </div>
            <span className="text-[11px]" style={{ color: "#7fff00", letterSpacing: 1 }}>{status.score}%</span>
          </div>

          <button
            onClick={toggleCamera}
            className="absolute top-2 right-2 z-20 text-xs px-3 py-1.5 rounded transition-all"
            style={{
              background: "rgba(2,4,8,0.75)",
              border: "1px solid rgba(255,0,110,0.4)",
              color: "#ff006e",
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: 2,
              backdropFilter: "blur(6px)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,0,110,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(2,4,8,0.75)")}
          >
            ▪ OFF
          </button>
        </div>
      ) : (
        <button
          onClick={toggleCamera}
          className="mt-2 w-full py-4 rounded-xl text-sm font-bold transition-all"
          style={{
            background: "rgba(0,245,255,0.04)",
            border: "1px solid rgba(0,245,255,0.2)",
            color: "#00f5ff",
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: 3,
            boxShadow: "0 0 20px rgba(0,245,255,0.06)",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,245,255,0.1)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(0,245,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,245,255,0.04)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(0,245,255,0.06)"; }}
        >
          ◉ AI KUZATUVINI YOQISH
        </button>
      )}
    </div>
  );
}
