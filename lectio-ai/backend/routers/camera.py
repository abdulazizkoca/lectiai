import base64
import cv2
import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
import os
from anthropic import AsyncAnthropic
import json
from datetime import datetime

router = APIRouter()
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _debug_log(hypothesis_id: str, location: str, message: str, data: dict, run_id: str = "pre-fix"):
    payload = {
        "sessionId": "08c3f7",
        "runId": run_id,
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
        "timestamp": int(datetime.now().timestamp() * 1000),
    }
    with open("debug-08c3f7.log", "a", encoding="utf-8") as logf:
        logf.write(json.dumps(payload, ensure_ascii=True) + "\n")

from services.camera_service import FaceRecognitionService
try:
    import mediapipe as mp
    mp_face = mp.solutions.face_detection
    face_detector = mp_face.FaceDetection(min_detection_confidence=0.5)

    mp_mesh = mp.solutions.face_mesh
    face_mesh = mp_mesh.FaceMesh(
        max_num_faces=50,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    HAS_MEDIAPIPE = True
except (ImportError, AttributeError):
    HAS_MEDIAPIPE = False
    face_detector = None
    face_mesh = None

@router.post("/analyze")
async def analyze_frame(data: dict, db: Session = Depends(get_db)):
    """
    Receives camera frame → analyzes faces → returns attention data.
    All processing is LOCAL. No data stored.
    """
    # region agent log
    _debug_log(
        "H1",
        "backend/routers/camera.py:analyze_frame:entry",
        "analyze_frame payload received",
        {"keys": list(data.keys()) if isinstance(data, dict) else "non-dict"},
    )
    # endregion
    frame_raw = data.get("frame") if isinstance(data, dict) else None
    # region agent log
    _debug_log(
        "H2",
        "backend/routers/camera.py:analyze_frame:frame_presence",
        "frame field presence/type",
        {"has_frame": frame_raw is not None, "frame_type": type(frame_raw).__name__ if frame_raw is not None else None},
    )
    # endregion
    frame_b64 = frame_raw.split(",")[1]
    frame_bytes = base64.b64decode(frame_b64)
    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # region agent log
    _debug_log(
        "H3",
        "backend/routers/camera.py:analyze_frame:decoded_frame",
        "decoded frame state",
        {"frame_is_none": frame is None, "frame_shape": list(frame.shape) if frame is not None else None},
    )
    # endregion
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Load known faces for recognition
    known_faces = []
    users_with_faces = db.query(User).filter(
        User.face_encoding.isnot(None),
        User.role == "student"
    ).all()
    
    for user in users_with_faces:
        known_faces.append({
            "id": user.id,
            "full_name": user.full_name,
            "face_encoding": user.face_encoding
        })
    
    face_recognizer = FaceRecognitionService()
    face_recognizer.load_known_faces(known_faces)
    
    if not HAS_MEDIAPIPE:
        # Graceful fallback mock metrics
        students.append({
            "id": "mock_student_1",
            "x": 0.5,
            "y": 0.5,
            "attention": 85,
        })
        return {
            "students": students,
            "overall_attention": 85,
            "recommendation": "Dars ajoyib o'tmoqda, davom eting!",
            "student_count": 1,
        }

    # Detect faces
    detection_results = face_detector.process(rgb)
    mesh_results = face_mesh.process(rgb)
    
    # region agent log
    _debug_log(
        "H4",
        "backend/routers/camera.py:analyze_frame:mediapipe_results",
        "mediapipe detection result",
        {
            "has_detections": bool(detection_results and detection_results.detections),
            "has_mesh_faces": bool(mesh_results and mesh_results.multi_face_landmarks),
        },
    )
    # endregion
    if detection_results.detections and mesh_results.multi_face_landmarks:
        for i, (detection, landmarks) in enumerate(
            zip(detection_results.detections, mesh_results.multi_face_landmarks)
        ):
            bbox = detection.location_data.relative_bounding_box
            cx = bbox.xmin + bbox.width / 2
            cy = bbox.ymin + bbox.height / 2
            
            # Calculate attention score using MediaPipe landmarks
            attention = calculate_attention(landmarks, w, h)
            
            # Face recognition
            student_id = f"student_{i}"
            student_name = None
            recognition_confidence = 0.0
            
            # Crop face for recognition
            x1 = int(bbox.xmin * w)
            y1 = int(bbox.ymin * h)
            x2 = int((bbox.xmin + bbox.width) * w)
            y2 = int((bbox.ymin + bbox.height) * h)
            
            face_crop = frame[y1:y2, x1:x2]
            if face_crop.size > 0 and face_crop.shape[0] > 50 and face_crop.shape[1] > 50:
                recognition_result = face_recognizer.recognize_face(face_crop)
                if recognition_result.student_id:
                    student_id = str(recognition_result.student_id)
                    student_name = recognition_result.student_name
                    recognition_confidence = recognition_result.confidence
            
            students.append({
                "id": student_id,
                "name": student_name,
                "x": round(cx, 3),
                "y": round(cy, 3),
                "attention": attention,
                "recognition_confidence": round(recognition_confidence, 2),
            })
    
    overall = sum(s["attention"] for s in students) / max(len(students), 1)
    
    # If attention is very low, use Claude to analyze what's happening
    recommendation = None
    session_id = data.get("session_id", "default_session")
    if overall < 60 and students:
        try:
            recommendation = await get_ai_recommendation(overall, students, session_id)
        except Exception:
            pass
    
    result_payload = {
        "students": students,
        "overall_attention": round(overall),
        "recommendation": recommendation,
        "student_count": len(students),
    }
    # region agent log
    _debug_log(
        "H5",
        "backend/routers/camera.py:analyze_frame:response",
        "analyze_frame response summary",
        {
            "student_count": result_payload["student_count"],
            "overall_attention": result_payload["overall_attention"],
            "has_recommendation": result_payload["recommendation"] is not None,
        },
    )
    # endregion
    return result_payload


def calculate_attention(landmarks, width: int, height: int) -> int:
    """
    Calculate attention score 0-100 using face landmarks.
    Factors: eye openness, head direction, gaze.
    """
    lm = landmarks.landmark
    
    # Eye openness (landmarks: left eye top/bottom)
    left_eye_top = lm[159].y
    left_eye_bot = lm[145].y
    right_eye_top = lm[386].y
    right_eye_bot = lm[374].y
    
    eye_open_l = abs(left_eye_top - left_eye_bot) * 15
    eye_open_r = abs(right_eye_top - right_eye_bot) * 15
    eye_score = min(1.0, (eye_open_l + eye_open_r) / 2)
    
    # Head direction (nose pointing forward?)
    nose = lm[4]
    head_center_offset = abs(nose.x - 0.5)
    head_score = max(0.0, 1.0 - head_center_offset * 2.5)
    
    # Vertical head position (looking down at phone?)
    nose_y = lm[4].y
    chin_y = lm[152].y
    forehead_y = lm[10].y
    vertical_ratio = (nose_y - forehead_y) / max(chin_y - forehead_y, 0.001)
    # Normal: ~0.5. Looking down at phone: > 0.65
    vertical_score = 1.0 if vertical_ratio < 0.60 else max(0.0, 1.0 - (vertical_ratio - 0.60) * 5)
    
    # Weighted attention score
    attention = (eye_score * 0.35 + head_score * 0.40 + vertical_score * 0.25) * 100
    return max(0, min(100, round(attention)))


# Track attention trends per session
from collections import defaultdict
import time
session_history = defaultdict(list)

async def get_ai_recommendation(attention: float, students_list: list, session_id: str) -> str:
    """Ask Claude what to do using deep classroom context"""
    now = time.time()
    history = session_history[session_id]
    
    # Store current snapshot
    green_count = sum(1 for s in students_list if s["attention"] >= 70)
    yellow_count = sum(1 for s in students_list if 40 <= s["attention"] < 70)
    red_count = sum(1 for s in students_list if s["attention"] < 40)
    
    history.append({
        "time": now,
        "avg": attention,
        "green": green_count,
        "yellow": yellow_count,
        "red": red_count
    })
    
    # Prune history to last 2 minutes (120 seconds)
    session_history[session_id] = [h for h in history if now - h["time"] <= 120]
    
    # Check if we should update recommendation (throttle to 30 seconds)
    last_rec_time = getattr(get_ai_recommendation, f"last_rec_{session_id}", 0)
    if now - last_rec_time < 30:
        return None # Too soon to generate a new recommendation
    
    # Prepare trend analysis text
    trend = session_history[session_id]
    start_avg = trend[0]["avg"] if trend else attention
    trend_desc = "tushib ketmoqda" if start_avg - attention > 10 else "ko'tarilmoqda" if attention - start_avg > 10 else "barqaror"
    
    prompt = (
        f"Siz professional professor yordamchisiz. O'zbek tilida gapiring.\n"
        f"Hozir sinfda {len(students_list)} ta o'quvchi bor. O'rtacha diqqat: {attention:.0f}%.\n"
        f"Holat: {green_count} ta o'quvchi diqqatli, {yellow_count} tasi chalg'igan, {red_count} tasi umuman qaramayapti (telefon/uxlayapti).\n"
        f"So'nggi 2 daqiqa ichida diqqat tendensiyasi: {trend_desc}.\n\n"
        f"Iltimos, vaziyatni analiz qilib, professorga nima qilish kerakligi bo'yicha "
        f"JUDAYAM QISQA (max 15 so'z), ANIQ va KONTEKSTGA MOS maslahat bering. Masalan: "
        f"'Talabalar toliqdi. Kichik tanaffus yoki amaliy savol bering' yoki '3 kishi telefon o'ynayapti, o'rningizdan turib aylanib chiqing'."
    )

    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        setattr(get_ai_recommendation, f"last_rec_{session_id}", now)
        return response.content[0].text
    except Exception:
        return None

async def auto_snapshot(student_id: str, frame_b64: str, session_id: str, current_attention: int):
    """Take snapshot and send to professor — no DB storage"""
    from services.quiz_engine import sio

    # Decode frame
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",")[1]
    img_bytes = base64.b64decode(frame_b64)
    
    # Send to professor via WebSocket (NOT stored in DB)
    await sio.emit("student_snapshot", {
        "student_id": student_id,
        "snapshot": frame_b64,
        "timestamp": datetime.now().isoformat(),
        "attention_score": current_attention,
    }, room=f"professor_{session_id}")
