"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface FaceRegistrationProps {
  userId: number;
  onRegistrationComplete: (success: boolean) => void;
}

// ─── Canvas helpers (same NEXUS palette) ──────────────────────────────────
const NX = { p: "#00f5ff", s: "#ff006e", a: "#7fff00", bg: "rgba(0,245,255,0.06)" };

function drawNexusFaceBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, conf: number, idx: number
) {
  const pad = 14, cl = 22;
  const bx = x - pad, by = y - pad, bw = w + pad * 2, bh = h + pad * 2;
  const t = Date.now() / 1000;
  ctx.save();

  ctx.fillStyle = NX.bg; ctx.fillRect(bx, by, bw, bh);

  const pulse = (Math.sin(t * 3 + idx) + 1) / 2;
  ctx.strokeStyle = NX.p; ctx.lineWidth = 1; ctx.globalAlpha = pulse * 0.22;
  ctx.strokeRect(bx - pulse * 8, by - pulse * 8, bw + pulse * 16, bh + pulse * 16);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.3; ctx.setLineDash([5, 4]);
  ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]); ctx.globalAlpha = 1;

  ctx.lineWidth = 2.5; ctx.strokeStyle = NX.p; ctx.shadowColor = NX.p; ctx.shadowBlur = 12;
  ([[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]] as [number,number,number,number][])
    .forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * cl, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * cl);
      ctx.stroke();
    });
  ctx.shadowBlur = 0;

  const scanY = by + ((t * 80) % bh);
  const sg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  sg.addColorStop(0, "transparent"); sg.addColorStop(0.5, NX.a + "88"); sg.addColorStop(1, "transparent");
  ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.65;
  ctx.beginPath(); ctx.moveTo(bx, scanY); ctx.lineTo(bx + bw, scanY); ctx.stroke();
  ctx.globalAlpha = 1;

  const cxc = bx + bw / 2, cyc = by + bh / 2, ch = 9;
  ctx.strokeStyle = NX.s; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(cxc - ch, cyc); ctx.lineTo(cxc + ch, cyc);
  ctx.moveTo(cxc, cyc - ch); ctx.lineTo(cxc, cyc + ch); ctx.stroke();
  ctx.fillStyle = NX.s; ctx.shadowColor = NX.s; ctx.shadowBlur = 7;
  ctx.beginPath(); ctx.arc(cxc, cyc, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;

  ctx.font = '10px "Share Tech Mono",monospace';
  ctx.fillStyle = NX.p; ctx.textAlign = "left";
  ctx.fillText(`YUZ ${String(idx + 1).padStart(2, "0")}`, bx + 2, by - 4);
  ctx.fillStyle = NX.a; ctx.textAlign = "right";
  ctx.fillText(`${Math.round(conf * 100)}%`, bx + bw - 2, by - 4);
  ctx.textAlign = "left"; ctx.restore();
}

function drawScanningReticle(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const t = Date.now() / 1000, cx = W / 2, cy = H / 2, r = 60 + Math.sin(t * 2) * 14;
  ctx.save();
  ctx.strokeStyle = NX.p; ctx.lineWidth = 1;
  ctx.globalAlpha = 0.12 + Math.sin(t * 3) * 0.06;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.4; ctx.lineWidth = 2;
  ([[0, 0.4],[0.55, 0.95],[1.1, 1.5],[1.65, 2.05]] as [number,number][]).forEach(([s, e]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, (s + t * 0.4) * Math.PI, (e + t * 0.4) * Math.PI); ctx.stroke();
  });
  ctx.globalAlpha = 0.55; ctx.font = '11px "Share Tech Mono",monospace';
  ctx.fillStyle = NX.p; ctx.textAlign = "center";
  ctx.fillText("YUZ IZLANMOQDA...", cx, cy + r + 18);
  ctx.textAlign = "left"; ctx.globalAlpha = 1; ctx.restore();
}

// ─── Component ─────────────────────────────────────────────────────────────
export function FaceRegistration({ userId, onRegistrationComplete }: FaceRegistrationProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const captureRef  = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<any>(null);
  const camRef      = useRef<any>(null);
  const rafRef      = useRef<number>(0);
  const facesRef    = useRef<{ x: number; y: number; w: number; h: number; conf: number }[]>([]);
  const fpsRef      = useRef({ frames: 0, last: Date.now(), value: 0 });

  const [status,     setStatus]     = useState<"idle" | "recording" | "processing" | "success" | "error">("idle");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [faceCount,  setFaceCount]  = useState(0);
  const [latency,    setLatency]    = useState(0);
  const [fps,        setFps]        = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // rAF render loop: draws mirrored video + overlays
  const renderLoop = useCallback(() => {
    const canvas = overlayRef.current, video = videoRef.current;
    if (!canvas || !video) { rafRef.current = requestAnimationFrame(renderLoop); return; }
    const ctx = canvas.getContext("2d"); if (!ctx) { rafRef.current = requestAnimationFrame(renderLoop); return; }
    const W = canvas.width, H = canvas.height;

    const fp = fpsRef.current; fp.frames++;
    const now = Date.now();
    if (now - fp.last >= 1000) {
      fp.value = Math.round((fp.frames * 1000) / (now - fp.last));
      fp.frames = 0; fp.last = now;
      setFps(fp.value);
    }

    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, W, H); ctx.restore();
    const fs = facesRef.current;
    if (fs.length > 0) fs.forEach((f, i) => drawNexusFaceBox(ctx, f.x, f.y, f.w, f.h, f.conf, i));
    else if (status === "recording") drawScanningReticle(ctx, W, H);

    // HUD: fps + time
    ctx.save();
    ctx.font = '9px "Share Tech Mono",monospace'; ctx.fillStyle = "#00f5ff"; ctx.globalAlpha = 0.4;
    ctx.textAlign = "right"; ctx.fillText(`${fp.value} FPS | ${latency}ms`, W - 6, H - 6);
    ctx.textAlign = "left"; ctx.globalAlpha = 1; ctx.restore();

    rafRef.current = requestAnimationFrame(renderLoop);
  }, [status, latency]);

  // MediaPipe results
  const onResults = useCallback((results: any) => {
    const dets: any[] = results?.detections ?? [];
    const W = 640, H = 480;
    if (dets.length === 0) { facesRef.current = []; setFaceCount(0); return; }
    facesRef.current = dets.map(d => {
      const bb = d.boundingBox;
      const mirX = 1 - (bb.xCenter - bb.width / 2) - bb.width;
      return { x: mirX * W, y: (bb.yCenter - bb.height / 2) * H, w: bb.width * W, h: bb.height * H, conf: d.score?.[0] ?? 0.9 };
    });
    setFaceCount(dets.length);
  }, []);

  const loadScripts = useCallback(async () => {
    if ((window as any).FaceDetection && (window as any).Camera) return;
    const load = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement("script"); s.src = src; s.crossOrigin = "anonymous"; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error(`Failed: ${src}`));
      document.body.appendChild(s);
    });
    await load("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
    await load("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    camRef.current?.stop?.(); detectorRef.current?.close?.();
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    facesRef.current = []; setFaceCount(0);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      await loadScripts();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const FD = (window as any).FaceDetection;
      detectorRef.current = new FD({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${f}` });
      detectorRef.current.setOptions({ model: "short", minDetectionConfidence: 0.5 });
      detectorRef.current.onResults(onResults);

      camRef.current = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          const t0 = performance.now();
          if (detectorRef.current && videoRef.current) await detectorRef.current.send({ image: videoRef.current });
          setLatency(Math.round(performance.now() - t0));
        }, width: 640, height: 480,
      });
      camRef.current.start();
      setStatus("recording");
      rafRef.current = requestAnimationFrame(renderLoop);
    } catch {
      setStatus("error"); setErrorMsg("Kamera ruxsat berilmadi yoki mavjud emas");
    }
  }, [loadScripts, onResults, renderLoop]);

  const captureAndRegister = useCallback(async () => {
    if (!videoRef.current || !captureRef.current) return;
    if (facesRef.current.length === 0) { setErrorMsg("Yuz aniqlanmadi. Kameraga qarab turing."); return; }
    setIsCapturing(true);
    try {
      const canvas = captureRef.current, video = videoRef.current, ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas xatosi");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/api/face-recognition/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, image_data: imageData }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Ro'yxatdan o'tish muvaffaqiyatsiz");
      }
      setStatus("success");
      onRegistrationComplete(true);
      setTimeout(() => stopCamera(), 2500);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Noma'lum xatolik");
      onRegistrationComplete(false);
    } finally {
      setIsCapturing(false);
    }
  }, [userId, onRegistrationComplete, stopCamera]);

  const handleStop = useCallback(() => { stopCamera(); setStatus("idle"); }, [stopCamera]);
  const handleRetry = useCallback(() => { setStatus("idle"); setErrorMsg(""); }, []);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); camRef.current?.stop?.(); detectorRef.current?.close?.(); }, []);

  return (
    <div style={{ background: "#020408", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 12, overflow: "hidden", fontFamily: "'Share Tech Mono',monospace", color: "#00f5ff" }}>
      {/* Title bar */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(0,245,255,0.15)", background: "rgba(2,4,8,0.9)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === "recording" ? "#7fff00" : "#444", boxShadow: status === "recording" ? "0 0 8px #7fff00" : "none" }} />
        <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, letterSpacing: 3, fontSize: 12, textShadow: "0 0 12px #00f5ff" }}>
          YUZNI RO'YXATDAN O'TKAZISH
        </span>
        {status === "recording" && (
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#7fff00", letterSpacing: 2 }}>
            YUZLAR: {faceCount} | {fps} FPS | {latency}ms
          </span>
        )}
      </div>

      {/* Camera view */}
      <div style={{ position: "relative", background: "#000" }}>
        <video ref={videoRef} muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0, pointerEvents: "none" }} />
        <canvas ref={overlayRef} width={640} height={480} style={{ width: "100%", aspectRatio: "4/3", display: "block" }} />
        <canvas ref={captureRef} style={{ display: "none" }} />

        {/* Scan line */}
        {status === "recording" && (
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00f5ff,transparent)", boxShadow: "0 0 16px #00f5ff", opacity: 0.5, zIndex: 6, pointerEvents: "none", animation: "nxScan 3.5s ease-in-out infinite" }} />
        )}

        {/* Idle overlay */}
        {status === "idle" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,4,8,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontSize: 32, animation: "nxBlink 2s infinite" }}>◈</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: 4, textShadow: "0 0 20px #00f5ff" }}>NEXUS VISION</div>
            <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.4 }}>YUZ ANIQLOVCHI TIZIM</div>
            <button onClick={startCamera} style={{ background: "transparent", border: "2px solid #00f5ff", color: "#00f5ff", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 3, padding: "10px 28px", cursor: "pointer", boxShadow: "0 0 16px rgba(0,245,255,0.25)" }}>
              ▶ KAMERANI YOQISH
            </button>
            <div style={{ fontSize: 8, opacity: 0.3, letterSpacing: 2, textAlign: "center" }}>KAMERA RUXSATINI BERING<br />YUZ · TANISH · SAQLASH</div>
          </div>
        )}

        {/* Processing overlay */}
        {status === "processing" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,4,8,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 28, animation: "nxSpin 1s linear infinite" }}>◌</div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#00f5ff" }}>QAYTA ISHLANMOQDA...</div>
          </div>
        )}

        {/* Success overlay */}
        {status === "success" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,4,8,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 36, color: "#7fff00", textShadow: "0 0 20px #7fff00" }}>✓</div>
            <div style={{ fontSize: 13, letterSpacing: 3, color: "#7fff00", textShadow: "0 0 12px #7fff00" }}>MUVAFFAQIYATLI!</div>
            <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: 2 }}>YUZ TIZIMGA SAQLANDI</div>
          </div>
        )}

        {/* No face warning while recording */}
        {status === "recording" && faceCount === 0 && (
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", fontSize: 10, letterSpacing: 2, color: "#ff006e", textShadow: "0 0 8px #ff006e", whiteSpace: "nowrap", zIndex: 8 }}>
            ⚠ YUZ ANIQLANMADI — KAMERAGA QARANG
          </div>
        )}

        {/* Face detected badge */}
        {status === "recording" && faceCount > 0 && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,255,65,0.15)", border: "1px solid rgba(0,255,65,0.4)", padding: "4px 10px", fontSize: 9, color: "#7fff00", letterSpacing: 2 }}>
            ● YUZ ANIQLANDI
          </div>
        )}
      </div>

      {/* Error message */}
      {status === "error" && (
        <div style={{ margin: "0", padding: "10px 16px", background: "rgba(255,0,110,0.08)", borderTop: "1px solid rgba(255,0,110,0.2)", fontSize: 11, color: "#ff006e", letterSpacing: 1 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Instructions */}
      {status === "idle" && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(0,245,255,0.1)", fontSize: 9, color: "rgba(0,245,255,0.4)", letterSpacing: 1, lineHeight: 2 }}>
          <div>▸ Kameraga to'g'ridan-to'g'ri qarab turing</div>
          <div>▸ Yaxshi yoritilgan joyda bo'ling</div>
          <div>▸ Yuzingiz to'liq ko'rinib tursin</div>
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,245,255,0.1)", background: "rgba(2,4,8,0.7)", display: "flex", gap: 10 }}>
        {status === "recording" && (
          <>
            <button onClick={handleStop} style={{ flex: 1, background: "transparent", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 2, padding: "9px 0", cursor: "pointer" }}>
              ■ TO'XTATISH
            </button>
            <button onClick={captureAndRegister} disabled={isCapturing || faceCount === 0} style={{ flex: 2, background: faceCount > 0 ? "rgba(0,245,255,0.12)" : "rgba(0,245,255,0.03)", border: `1px solid ${faceCount > 0 ? "#00f5ff" : "rgba(0,245,255,0.15)"}`, color: faceCount > 0 ? "#00f5ff" : "rgba(0,245,255,0.3)", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, padding: "9px 0", cursor: faceCount > 0 ? "pointer" : "not-allowed", boxShadow: faceCount > 0 ? "0 0 14px rgba(0,245,255,0.2)" : "none" }}>
              {isCapturing ? "◌ SAQLANMOQDA..." : "◈ RO'YXATDAN O'TKAZISH"}
            </button>
          </>
        )}
        {(status === "error") && (
          <button onClick={handleRetry} style={{ flex: 1, background: "transparent", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 2, padding: "9px 0", cursor: "pointer" }}>
            ↺ QAYTA URINISH
          </button>
        )}
        {status === "success" && (
          <button onClick={() => onRegistrationComplete(true)} style={{ flex: 1, background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)", color: "#7fff00", fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, padding: "9px 0", cursor: "pointer" }}>
            ✓ YAKUNLASH
          </button>
        )}
      </div>

      <style>{`
        @keyframes nxScan { 0%{top:0;opacity:0} 10%{opacity:0.5} 90%{opacity:0.5} 100%{top:100%;opacity:0} }
        @keyframes nxBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes nxSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}