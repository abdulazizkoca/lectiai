"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function FaceMonitor() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cvStatus, setCvStatus] = useState('Yuklanmoqda...');
  const [camStatus, setCamStatus] = useState('—');
  const [cascadeStatus, setCascadeStatus] = useState('—');
  const [faceCount, setFaceCount] = useState<number | string>('—');
  const [fps, setFps] = useState<number | string>('—');
  const [frameCount, setFrameCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const classifierRef = useRef<any>(null);
  
  // Xotirani tejash va tezlikni oshirish uchun kichraytirilgan o'lcham
  const DW = 320;
  const DH = 240;
  const detectCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const srcMatRef = useRef<any>(null);
  const grayMatRef = useRef<any>(null);
  const facesRef = useRef<any>(null);
  
  const lastTimeRef = useRef<number>(Date.now());
  const framesRef = useRef<number>(0);
  const frameSkipRef = useRef<number>(0);
  const trackedFacesRef = useRef<any[]>([]);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

    :root {
      --bg: #0A0A0F;
      --surface: #18181F;
      --panel: #18181F;
      --accent: #0D9373;
      --accent2: #E84855;
      --text: #ffffff;
      --text-dim: rgba(255,255,255,0.4);
      --border: rgba(255,255,255,0.1);
    }

    .monitor-body {
      background: var(--bg);
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 50; 
    }

    .monitor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      z-index: 10;
    }

    .logo {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.1em;
      color: var(--accent);
    }
    .logo span { color: var(--text-dim); font-weight: 400; }

    .status-bar { display: flex; align-items: center; gap: 24px; }
    .face-count-display { display: flex; align-items: baseline; gap: 8px; }
    .face-number {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 36px;
      color: var(--accent);
    }
    .face-label { font-size: 10px; color: var(--text-dim); }

    .toggle-btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 12px 26px;
      border: 1px solid var(--accent);
      background: transparent;
      color: var(--accent);
      cursor: pointer;
      transition: all 0.2s;
    }
    .toggle-btn:hover { background: var(--accent); color: var(--bg); }
    .toggle-btn.active { border-color: var(--accent2); color: var(--accent2); }
    .toggle-btn.active:hover { background: var(--accent2); color: var(--bg); }

    .monitor-main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 240px;
      height: calc(100vh - 65px);
    }

    .video-section {
      position: relative;
      background: #020203;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #outputCanvas {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .idle-screen {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .idle-text { font-size: 13px; color: var(--text-dim); letter-spacing: 0.2em; }

    .side-panel {
      background: var(--panel);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 20px 16px;
      gap: 24px;
    }

    .panel-section { display: flex; flex-direction: column; gap: 10px; }
    .panel-label {
      font-size: 10px; font-weight: 700; color: var(--accent);
      border-bottom: 1px solid rgba(0,255,136,0.2); padding-bottom: 8px;
    }

    .stat-row { display: flex; justify-content: space-between; font-size: 11px; }
    .stat-key { color: var(--text-dim); }
    .stat-val { color: var(--text); font-weight: 700; }
    .stat-val.green { color: var(--accent); }
    
    .fps-bar-track { height: 3px; background: var(--border); border-radius: 2px; }
    .fps-bar-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
    #hiddenVideo { display: none; }
  `;

  useEffect(() => {
    const loadOpenCV = async () => {
      if ((window as any).cv) {
        initCascade();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://docs.opencv.org/4.8.0/opencv.js";
      script.async = true;
      script.onload = () => initCascade();
      document.body.appendChild(script);
    };

    const initCascade = async () => {
      const cv = (window as any).cv;
      setCvStatus("TAYYOR");
      setCascadeStatus("YUKLANMOQDA...");
      
      try {
        const response = await fetch('/haarcascade.xml');
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        
        cv.FS_createDataFile('/', 'haarcascade.xml', data, true, false, false);
        classifierRef.current = new cv.CascadeClassifier();
        classifierRef.current.load('haarcascade.xml');
        setCascadeStatus("AKTIV");
      } catch (err) {
        console.error("Cascade Error:", err);
        setCascadeStatus("XATO");
      }
    };

    loadOpenCV();

    // Optimizatsiya uchun yashirin canvas
    if (!detectCanvasRef.current && typeof document !== 'undefined') {
        const dCanvas = document.createElement('canvas');
        dCanvas.width = DW;
        dCanvas.height = DH;
        detectCanvasRef.current = dCanvas;
    }

    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setCamStatus("ULANMOQDA...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCamStatus("FAOL");
      setIsCameraOn(true);
      
      const cv = (window as any).cv;
      if (cv && classifierRef.current) {
        videoRef.current!.onloadedmetadata = () => {
            const width = videoRef.current!.videoWidth;
            const height = videoRef.current!.videoHeight;
            canvasRef.current!.width = width;
            canvasRef.current!.height = height;
            
            if (!srcMatRef.current) {
                srcMatRef.current = new cv.Mat(DH, DW, cv.CV_8UC4);
                grayMatRef.current = new cv.Mat(DH, DW, cv.CV_8UC1);
                facesRef.current = new cv.RectVector();
            }
            
            lastTimeRef.current = Date.now();
            framesRef.current = 0;
            frameSkipRef.current = 0;
            trackedFacesRef.current = [];
            processVideo();
        };
      }
    } catch (err) {
      console.error(err);
      setCamStatus("RUXSAT YO'Q");
    }
  };

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    
    // Memory leak oldini olish
    try {
        if (srcMatRef.current) { srcMatRef.current.delete(); srcMatRef.current = null; }
        if (grayMatRef.current) { grayMatRef.current.delete(); grayMatRef.current = null; }
        if (facesRef.current) { facesRef.current.delete(); facesRef.current = null; }
    } catch(e) {}
    
    setIsCameraOn(false);
    setCamStatus("O'CHIRILGAN");
    setFaceCount('—');
    setFps('—');
    
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const toggleCamera = () => isCameraOn ? stopCamera() : startCamera();

  const processVideo = () => {
    if (!isCameraOn && !streamRef.current) return;
    const cv = (window as any).cv;
    if (!cv || !videoRef.current || !canvasRef.current || !classifierRef.current || !detectCanvasRef.current) return;

    try {
        const ctx = canvasRef.current.getContext('2d');
        const cWidth = canvasRef.current.width;
        const cHeight = canvasRef.current.height;

        ctx?.drawImage(videoRef.current, 0, 0, cWidth, cHeight);
        
        let newDetections: any[] = [];
        let didDetect = false;

        // 2 kadrda 1 marta OpenCV ishlatiladi (Tezlik uchun)
        frameSkipRef.current++;
        if (frameSkipRef.current >= 2) {
            frameSkipRef.current = 0;
            didDetect = true;
            
            const dCtx = detectCanvasRef.current.getContext('2d', { willReadFrequently: true });
            dCtx?.drawImage(videoRef.current, 0, 0, DW, DH);
            
            let imageData = dCtx?.getImageData(0, 0, DW, DH);
            if (imageData && srcMatRef.current) {
                srcMatRef.current.data.set(imageData.data);
                cv.cvtColor(srcMatRef.current, grayMatRef.current, cv.COLOR_RGBA2GRAY, 0);
                
                classifierRef.current.detectMultiScale(
                    grayMatRef.current, facesRef.current, 1.1, 4, 0, 
                    new cv.Size(30, 30), new cv.Size(0, 0)
                );
                
                const count = facesRef.current.size();
                for (let i = 0; i < count; ++i) {
                    newDetections.push(facesRef.current.get(i));
                }
                setFaceCount(count);
            }
        }

        const ratioX = cWidth / DW;
        const ratioY = cHeight / DH;

        // Yumshoq harakat (Smooth LERP Tracking)
        if (didDetect) {
            if (newDetections.length === trackedFacesRef.current.length) {
                for (let i = 0; i < newDetections.length; i++) {
                    const nd = newDetections[i];
                    const tf = trackedFacesRef.current[i];
                    tf.targetX = nd.x; tf.targetY = nd.y;
                    tf.targetW = nd.width; tf.targetH = nd.height;
                }
            } else {
                trackedFacesRef.current = newDetections.map(f => ({
                    x: f.x, y: f.y, w: f.width, h: f.height,
                    targetX: f.x, targetY: f.y, targetW: f.width, targetH: f.height
                }));
            }
        }

        trackedFacesRef.current.forEach(tf => {
            // LERP yumshatish
            tf.x += (tf.targetX - tf.x) * 0.4;
            tf.y += (tf.targetY - tf.y) * 0.4;
            tf.w += (tf.targetW - tf.w) * 0.4;
            tf.h += (tf.targetH - tf.h) * 0.4;

            const rx = tf.x * ratioX;
            const ry = tf.y * ratioY;
            const rw = tf.w * ratioX;
            const rh = tf.h * ratioY;
            
            // Toza va sodda ramka (Oshiqcha effektlarsiz)
            ctx!.strokeStyle = '#0D9373';
            ctx!.lineWidth = 2;
            ctx!.strokeRect(rx, ry, rw, rh);
        });

        setFrameCount(prev => prev + 1);
        framesRef.current++;
        const now = Date.now();
        if (now - lastTimeRef.current >= 1000) {
            setFps(framesRef.current);
            framesRef.current = 0;
            lastTimeRef.current = now;
        }
        
    } catch (err) {
        console.error(err);
    }

    animationRef.current = requestAnimationFrame(processVideo);
  };

  return (
    <div className="monitor-body">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <header className="monitor-header">
        <div className="logo">LectioAI <span>// AI MONITOR</span></div>
        <div className="status-bar">
          <div className="face-count-display">
            <div className="face-number">{faceCount}</div>
            <div className="face-label">YUZ<br/>ANIQLANDI</div>
          </div>
          <button className={`toggle-btn ${isCameraOn ? 'active' : ''}`} onClick={toggleCamera}>
            {isCameraOn ? 'KAMERANI O\'CHIRISH' : 'KAMERANI YOQISH'}
          </button>
        </div>
      </header>

      <main className="monitor-main">
        <div className="video-section">
          {!isCameraOn && (
            <div className="idle-screen">
              <div className="idle-text">KAMERA O'CHIQ</div>
            </div>
          )}
          <canvas id="outputCanvas" ref={canvasRef} style={{ display: isCameraOn ? 'block' : 'none' }}></canvas>
          <video id="hiddenVideo" ref={videoRef} autoPlay muted playsInline></video>
        </div>

        <div className="side-panel">
          <div className="panel-section">
            <div className="panel-label">TIZIM HOLATI</div>
            <div className="stat-row"><span className="stat-key">OpenCV</span><span className="stat-val green">{cvStatus}</span></div>
            <div className="stat-row"><span className="stat-key">Kamera</span><span className="stat-val">{camStatus}</span></div>
            <div className="stat-row"><span className="stat-key">Model</span><span className="stat-val">{cascadeStatus}</span></div>
          </div>

          <div className="panel-section">
            <div className="panel-label">PERFORMANCE</div>
            <div className="stat-row"><span className="stat-key">FPS</span><span className="stat-val green">{fps}</span></div>
            <div className="fps-bar-track">
                <div className="fps-bar-fill" style={{ width: typeof fps === 'number' ? `${Math.min(100, (fps / 30) * 100)}%` : '0%' }}></div>
            </div>
            <div className="stat-row"><span className="stat-key">Kadrlar</span><span className="stat-val">{frameCount}</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}
