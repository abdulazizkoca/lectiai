"""
Camera Service — Talabalar diqqatini kuzatish.
OpenCV va MediaPipe ixtiyoriy — o'rnatilmasa demo data qaytaradi.
"""
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
import asyncio
import random

@dataclass
class AttentionData:
    attention_level: float      # 0.0 - 1.0
    confusion_detected: bool
    boredom_detected: bool
    students_count: int
    recommendation: Optional[str]


# OpenCV va MediaPipe ni ixtiyoriy import qilamiz
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    try:
        from mediapipe.python.solutions import face_mesh, face_detection
        mp_face_mesh = face_mesh
        mp_face_detection = face_detection
    except ImportError:
        mp_face_mesh = mp.solutions.face_mesh
        mp_face_detection = mp.solutions.face_detection
    
    # Check if critical components are actually available
    _ = mp_face_mesh.FaceMesh
    _ = mp_face_detection.FaceDetection
    CAMERA_AVAILABLE = True
except (ImportError, AttributeError) as e:
    CAMERA_AVAILABLE = False
    print(f"WARNING: OpenCV/MediaPipe issue ({e}). Camera running in demo mode.")


@dataclass
class RecognitionResult:
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    confidence: float = 0.0


class FaceRecognitionService:
    """
    Face recognition service using face-recognition library
    """

    def __init__(self, tolerance: float = 0.6):
        self.tolerance = tolerance
        self.known_encodings = []
        self.known_ids = []
        self.known_names = []
        self.is_loaded = False

    def load_known_faces(self, faces_data: List[Dict[str, Any]]):
        """
        Load known face encodings from database
        """
        self.known_encodings = []
        self.known_ids = []
        self.known_names = []

        for face in faces_data:
            if face.get('face_encoding'):
                encoding = np.array(face['face_encoding'])
                self.known_encodings.append(encoding)
                self.known_ids.append(face['id'])
                self.known_names.append(face['full_name'])

        self.is_loaded = True

    def recognize_face(self, face_image: np.ndarray) -> RecognitionResult:
        """
        Recognize a face from image
        """
        if not self.is_loaded or len(self.known_encodings) == 0:
            return RecognitionResult()

        try:
            import face_recognition

            # Convert BGR to RGB if needed
            if face_image.shape[2] == 3:
                rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = face_image

            # Get face encoding
            face_encodings = face_recognition.face_encodings(rgb_image)

            if len(face_encodings) == 0:
                return RecognitionResult()

            face_encoding = face_encodings[0]

            # Compare with known faces
            distances = face_recognition.face_distance(self.known_encodings, face_encoding)

            # Find best match
            min_distance_idx = np.argmin(distances)
            min_distance = distances[min_distance_idx]

            if min_distance <= self.tolerance:
                confidence = 1.0 - min_distance
                return RecognitionResult(
                    student_id=self.known_ids[min_distance_idx],
                    student_name=self.known_names[min_distance_idx],
                    confidence=confidence
                )

        except ImportError:
            print("face-recognition library not installed")
        except Exception as e:
            print(f"Face recognition error: {e}")

        return RecognitionResult()

    def register_face(self, face_image: np.ndarray) -> Optional[List[float]]:
        """
        Generate face encoding for registration
        """
        try:
            import face_recognition

            # Convert BGR to RGB if needed
            if face_image.shape[2] == 3:
                rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = face_image

            # Get face encoding
            face_encodings = face_recognition.face_encodings(rgb_image)

            if len(face_encodings) > 0:
                return face_encodings[0].tolist()

        except ImportError:
            print("face-recognition library not installed")
        except Exception as e:
            print(f"Face encoding error: {e}")

        return None



class CameraAnalyzer:
    def __init__(self):
        if CAMERA_AVAILABLE:
            self.mp_face_mesh = mp_face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
                max_num_faces=50
            )
            self.mp_face_detection = mp_face_detection
            self.face_detection = self.mp_face_detection.FaceDetection(
                min_detection_confidence=0.5
            )

    def analyze_frame(self, frame) -> AttentionData:
        """Bir kadrni tahlil qilish"""
        if not CAMERA_AVAILABLE:
            return self._demo_attention()

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        detection_results = self.face_detection.process(rgb_frame)
        students_count = 0
        if detection_results.detections:
            students_count = len(detection_results.detections)

        mesh_results = self.face_mesh.process(rgb_frame)

        attention_scores = []
        confusion_signals = 0

        if mesh_results.multi_face_landmarks:
            for face_landmarks in mesh_results.multi_face_landmarks:
                eye_openness = self._calculate_eye_openness(face_landmarks)
                head_direction = self._calculate_head_direction(face_landmarks)
                attention_score = (eye_openness * 0.6) + (head_direction * 0.4)
                attention_scores.append(attention_score)

                if self._detect_confusion(face_landmarks):
                    confusion_signals += 1

        avg_attention = np.mean(attention_scores) if attention_scores else 0.5
        confusion_ratio = confusion_signals / max(len(attention_scores), 1)

        recommendation = None
        if avg_attention < 0.4:
            recommendation = "polling"
        elif confusion_ratio > 0.7:
            recommendation = "wow_fact"
        elif avg_attention < 0.6:
            recommendation = "interaction"

        return AttentionData(
            attention_level=round(float(avg_attention), 2),
            confusion_detected=confusion_ratio > 0.5,
            boredom_detected=float(avg_attention) < 0.4,
            students_count=students_count,
            recommendation=recommendation
        )

    def _calculate_eye_openness(self, landmarks) -> float:
        left_eye_top = landmarks.landmark[159].y
        left_eye_bottom = landmarks.landmark[145].y
        left_eye_openness = abs(left_eye_top - left_eye_bottom) * 10
        return min(1.0, left_eye_openness)

    def _calculate_head_direction(self, landmarks) -> float:
        nose_tip = landmarks.landmark[4]
        center_offset = abs(nose_tip.x - 0.5)
        return max(0.0, 1.0 - center_offset * 3)

    def _detect_confusion(self, landmarks) -> bool:
        left_brow = landmarks.landmark[70].y
        right_brow = landmarks.landmark[300].y
        brow_asymmetry = abs(left_brow - right_brow)
        return brow_asymmetry > 0.02

    def _demo_attention(self) -> AttentionData:
        """Demo rejim — real kamerasiz ishlash uchun"""
        attention = round(random.uniform(0.5, 0.95), 2)
        return AttentionData(
            attention_level=attention,
            confusion_detected=random.random() < 0.2,
            boredom_detected=attention < 0.4,
            students_count=random.randint(20, 50),
            recommendation="polling" if attention < 0.4 else None
        )


camera = CameraAnalyzer()


async def get_realtime_attention(camera_index: int = 0):
    """Kamera ma'lumotlarini real vaqtda qaytarish generator"""
    if not CAMERA_AVAILABLE:
        # Demo mode — simulyatsiya
        while True:
            yield {
                "attention": round(random.uniform(0.5, 0.95), 2),
                "confusion": random.random() < 0.2,
                "boredom": False,
                "students": random.randint(20, 50),
                "recommendation": None
            }
            await asyncio.sleep(2)
        return

    cap = cv2.VideoCapture(camera_index)
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            data = camera.analyze_frame(frame)
            yield {
                "attention": data.attention_level,
                "confusion": data.confusion_detected,
                "boredom": data.boredom_detected,
                "students": data.students_count,
                "recommendation": data.recommendation
            }
            await asyncio.sleep(2)
    finally:
        cap.release()
