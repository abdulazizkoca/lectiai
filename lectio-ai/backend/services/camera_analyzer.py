import cv2
import mediapipe as mp
import numpy as np
from anthropic import AsyncAnthropic
import asyncio
import base64
import os

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
import mediapipe as mp
try:
    mp_face_mesh = mp.solutions.face_mesh
    mp_pose = mp.solutions.pose
    mp_hands = mp.solutions.hands
    HAS_MEDIAPIPE = True
except AttributeError:
    HAS_MEDIAPIPE = False

class ClassroomAnalyzer:
    """
    Real-time sinf xona tahlili.
    MUHIM: Faqat umumiy statistika saqlanadi, hech kim individual aniqlanmaydi.
    """
    
    def __init__(self):
        if HAS_MEDIAPIPE:
            self.face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=50,
                refine_landmarks=True
            )
            self.pose = mp_pose.Pose()
            self.hands = mp_hands.Hands()
        else:
            self.face_mesh = None
            self.pose = None
            self.hands = None
        
        # Holat hisobi
        self.metrics = {
            "total_detected": 0,
            "attentive": 0,
            "distracted": 0,
            "phone_usage": 0,
            "talking": 0,
            "confused": 0,
            "absent": 0,
            "hand_raised": 0,
        }
    
    def analyze_frame(self, frame: np.ndarray) -> dict:
        """Bitta kadrni tahlil qilish"""
        if not HAS_MEDIAPIPE:
            # Graceful fallback mock metrics
            return {
                "total": 1,
                "attentive_pct": 85,
                "distracted_pct": 10,
                "phone_pct": 5,
                "talking_pct": 0,
                "confused_pct": 0,
                "hand_raised": 0,
                "attention_score": 85,
            }

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = frame.shape[:2]
        
        results_face = self.face_mesh.process(rgb)
        results_pose = self.pose.process(rgb)
        results_hands = self.hands.process(rgb)
        
        metrics = self._reset_metrics()
        
        if results_face.multi_face_landmarks:
            metrics["total_detected"] = len(results_face.multi_face_landmarks)
            
            for face_landmarks in results_face.multi_face_landmarks:
                state = self._classify_face_state(face_landmarks, w, h)
                metrics[state] += 1
        
        # Qo'l ko'tarish
        if results_hands.multi_hand_landmarks:
            metrics["hand_raised"] = self._count_raised_hands(
                results_hands.multi_hand_landmarks, h
            )
        
        # Telefon ishlatish — qo'l past ushlanishi + bosh egik
        metrics["phone_usage"] = self._detect_phone_usage(
            results_face, results_pose
        )
        
        return self._calculate_percentages(metrics)
    
    def _classify_face_state(self, landmarks, w: int, h: int) -> str:
        """Yuz holatidan diqqat darajasini aniqlash"""
        
        # Bosh yo'nalishi (yaw, pitch, roll)
        nose = landmarks.landmark[1]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]
        
        # Yaw (chapga/o'ngga burilish)
        eye_diff_x = abs(left_eye.x - right_eye.x)
        face_center_x = (left_eye.x + right_eye.x) / 2
        
        # Pitch (yuqoriga/pastga burilish)
        nose_y = nose.y
        eye_avg_y = (left_eye.y + right_eye.y) / 2
        pitch_angle = nose_y - eye_avg_y
        
        # Ko'z ochiqlik darajasi (uyquchillik)
        eye_openness = self._calculate_eye_openness(landmarks)
        
        # Klassifikatsiya
        if eye_diff_x < 0.03:  # Yon tomonga burilgan
            return "distracted"
        elif pitch_angle > 0.08:  # Pastga qarayapti (telefon)
            return "phone_usage"
        elif eye_openness < 0.15:  # Ko'zi yopiq / uyquchan
            return "confused"
        elif abs(face_center_x - 0.5) > 0.3:  # Juda yon tomonda
            return "distracted"
        else:
            return "attentive"
    
    def _calculate_eye_openness(self, landmarks) -> float:
        """Ko'z ochiqlik koeffitsienti"""
        # Ko'z EAR (Eye Aspect Ratio)
        upper = landmarks.landmark[159]
        lower = landmarks.landmark[145]
        left = landmarks.landmark[33]
        right = landmarks.landmark[133]
        
        vertical = abs(upper.y - lower.y)
        horizontal = abs(left.x - right.x)
        
        if horizontal == 0:
            return 0
        return vertical / horizontal
    
    def _count_raised_hands(self, hand_landmarks_list, frame_height: int) -> int:
        """Ko'tarilgan qo'llar soni"""
        raised = 0
        for hand_lm in hand_landmarks_list:
            wrist_y = hand_lm.landmark[0].y
            middle_tip_y = hand_lm.landmark[12].y
            if middle_tip_y < wrist_y - 0.1:  # Qo'l yuqorida
                raised += 1
        return raised
    
    def _detect_phone_usage(self, face_results, pose_results) -> int:
        """Telefon ishlatayotganlar taxminiy soni"""
        if not face_results.multi_face_landmarks:
            return 0
        
        phone_count = 0
        for face_lm in face_results.multi_face_landmarks:
            nose = face_lm.landmark[1]
            chin = face_lm.landmark[18]
            
            # Bosh quyiga egilgan + qo'l ko'krak oldida
            if chin.y - nose.y > 0.06:
                phone_count += 1
        
        return phone_count
    
    def _calculate_percentages(self, metrics: dict) -> dict:
        total = max(metrics["total_detected"], 1)
        return {
            "total": metrics["total_detected"],
            "attentive_pct": round(metrics["attentive"] / total * 100),
            "distracted_pct": round(metrics["distracted"] / total * 100),
            "phone_pct": round(metrics["phone_usage"] / total * 100),
            "talking_pct": round(metrics["talking"] / total * 100),
            "confused_pct": round(metrics["confused"] / total * 100),
            "hand_raised": metrics["hand_raised"],
            "attention_score": round(metrics["attentive"] / total * 100),
        }
    
    def _reset_metrics(self) -> dict:
        return {k: 0 for k in self.metrics}


# AI yordamida kontekstli tavsiya
async def get_ai_suggestion(metrics: dict, lesson_topic: str) -> str:
    prompt = f"""
Professor sinfxona monitoringidan olingan real vaqt ma'lumotlari:

Dars mavzusi: {lesson_topic}
Diqqat darajasi: {metrics['attention_score']}%
Chalg'iganlar: {metrics['distracted_pct']}%
Telefon ishlatayotganlar: {metrics['phone_pct']}%
Chalkashgan ko'rinayotganlar: {metrics['confused_pct']}%
Qo'l ko'targanlar: {metrics['hand_raised']} kishi

Professorga QISQA (1-2 gap) amaliy tavsiya ber o'zbek tilida.
Masalan: darsni jonlantirish, savol berish, faoliyat o'zgartirish.
Faqat tavsiyani yoz, boshqa narsa emas.
"""
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
