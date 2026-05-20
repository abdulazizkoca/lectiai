"""
Camera Service — Talabalar diqqatini kuzatish, obyektlarni aniqlash, atrof-muhit tahlili va Real Vaqt Optimizatsiyasi (Performance & Parallelism).
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple
import asyncio
import importlib
import random
import time
import math
import threading
import concurrent.futures

@dataclass
class StudentBehavior:
    eye_gaze: str
    head_pose: str
    body_posture: str
    emotion_state: str
    is_using_phone: bool
    blink_rate: int
    restlessness_score: float
    detected_objects: List[str]
    attention_score: int       
    status_color: str          
    needs_screenshot: bool     

@dataclass
class EnvironmentData:
    brightness_level: float
    low_light_warning: bool
    noise_level_db: float
    high_noise_warning: bool
    total_people_count: int
    ptz_suggestion: str

@dataclass
class AttentionData:
    attention_level: float      
    confusion_detected: bool
    boredom_detected: bool
    students_count: int
    students_count_changed: bool
    standing_up_detected: bool
    unknown_faces_count: int
    environment: EnvironmentData
    recommendation: Optional[str]
    processing_latency_ms: float # Real vaqt hisobi: 100ms dan kam bo'lishi kerak
    behaviors: List[StudentBehavior] = field(default_factory=list)


# Asosiy kutubxonalarni yuklash
try:
    import cv2
    import numpy as np
    mp = importlib.import_module("mediapipe")
    try:
        mp_face_mesh = mp.solutions.face_mesh
        mp_face_detection = mp.solutions.face_detection
        mp_pose = mp.solutions.pose
        mp_hands = mp.solutions.hands
    except AttributeError:
        mp_solutions = importlib.import_module("mediapipe.python.solutions")
        mp_face_mesh = mp_solutions.face_mesh
        mp_face_detection = mp_solutions.face_detection
        mp_pose = mp_solutions.pose
        mp_hands = mp_solutions.hands

    _ = mp_face_mesh.FaceMesh
    _ = mp_face_detection.FaceDetection
    _ = mp_pose.Pose
    _ = mp_hands.Hands
    CAMERA_AVAILABLE = True
except (ImportError, AttributeError, ModuleNotFoundError) as e:
    CAMERA_AVAILABLE = False
    print(f"WARNING: OpenCV/MediaPipe issue ({e}).")

# GPU Acceleration (CUDA) and CPU optimization for YOLO
try:
    YOLO = importlib.import_module("ultralytics").YOLO
    torch = importlib.import_module("torch")
    _yolo_model = YOLO('yolov8n.pt')
    if torch.cuda.is_available():
        _yolo_model.to('cuda')
        print("INFO: YOLO modeli GPU (CUDA) orqali ishlamoqda. Yuqori FPS ta'minlanadi.")
    else:
        print("INFO: YOLO modeli CPU orqali ishlamoqda. Kadrlar o'tkazib yuborish (Frame skipping) yoqildi.")
    YOLO_AVAILABLE = True
except (ImportError, ModuleNotFoundError, AttributeError):
    YOLO_AVAILABLE = False
    _yolo_model = None

try:
    pyaudio = importlib.import_module("pyaudio")
    audioop = importlib.import_module("audioop")
    AUDIO_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    AUDIO_AVAILABLE = False
    pyaudio = None
    audioop = None


class AudioAnalyzer:
    def __init__(self):
        self.noise_db = 0.0
        self.is_running = False
        self.stream = None
        self.p = None
        if AUDIO_AVAILABLE:
            try:
                self.p = pyaudio.PyAudio()
                self.stream = self.p.open(format=pyaudio.paInt16, channels=1, rate=44100, input=True, frames_per_buffer=1024)
                self.is_running = True
                threading.Thread(target=self._monitor_noise, daemon=True).start()
            except Exception:
                self.is_running = False

    def _monitor_noise(self):
        while self.is_running and self.stream:
            try:
                data = self.stream.read(1024, exception_on_overflow=False)
                rms = audioop.rms(data, 2)
                if rms > 0:
                    self.noise_db = min(120.0, max(0.0, 20 * math.log10(rms)))
            except Exception: pass
            time.sleep(0.1)

    def get_noise_level(self) -> float:
        if not self.is_running: return round(random.uniform(30.0, 55.0), 2)
        return round(self.noise_db, 2)


audio_analyzer = AudioAnalyzer()


class FaceRecognitionService:
    def __init__(self, tolerance: float = 0.5):
        self.tolerance = tolerance 
        self.known_encodings = []
        self.known_ids = []
        self.known_names = []
        self.is_loaded = False
        self.blur_threshold = 30.0
        
        # DeepFace or InsightFace integration (RAM optimized)
        try:
            self.deepface = importlib.import_module("deepface").DeepFace
            self.use_deepface = True
        except (ImportError, ModuleNotFoundError):
            self.use_deepface = False

    def extract_encoding(self, face_image: np.ndarray) -> list:
        """DeepFace yoki yengil model orqali embedding olish"""
        if self.use_deepface:
            try:
                # RAM kam serverlar uchun eng yengil model Facenet512 yoki VGG-Face ishlatiladi
                # enforce_detection=False, chunki yuz qirqishni MediaPipe qilib bo'lgan
                embedding_objs = self.deepface.represent(
                    img_path=face_image, 
                    model_name="Facenet", 
                    enforce_detection=False
                )
                return embedding_objs[0]["embedding"]
            except Exception as e:
                pass
        return []

    def load_known_faces(self, faces_data: List[Dict[str, Any]]):
        self.known_encodings, self.known_ids, self.known_names = [], [], []
        for face in faces_data:
            if face.get('face_encoding'):
                self.known_encodings.append(np.array(face['face_encoding']))
                self.known_ids.append(face['id'])
                self.known_names.append(face['full_name'])
        self.is_loaded = True

    def check_face_quality(self, face_image: np.ndarray) -> bool:
        if face_image.size == 0: return False
        return cv2.Laplacian(cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() > self.blur_threshold

    def check_liveness(self, landmarks) -> bool:
        return ((landmarks.landmark[234].z + landmarks.landmark[454].z) / 2.0 - landmarks.landmark[4].z) > 0.005

    def check_face_pose(self, landmarks) -> bool:
        ratio = abs(landmarks.landmark[4].x - landmarks.landmark[234].x) / max(0.001, abs(landmarks.landmark[454].x - landmarks.landmark[4].x))
        return 0.1 <= ratio <= 10.0

    def register_face(self, face_image: np.ndarray) -> Optional[List[float]]:
        if face_image is None or not isinstance(face_image, np.ndarray) or face_image.size == 0:
            return None

        if self.use_deepface:
            try:
                embedding_objs = self.deepface.represent(
                    img_path=face_image,
                    model_name="Facenet",
                    enforce_detection=False
                )
                return embedding_objs[0]["embedding"]
            except Exception:
                pass

        try:
            if face_image.ndim == 3:
                gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_image

            resized = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA)
            vector = resized.astype(np.float32).flatten()
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector /= norm
            return vector.tolist()
        except Exception:
            return None

    def recognize_face(self, face_image: np.ndarray) -> "RecognitionResult":
        if face_image is None or not isinstance(face_image, np.ndarray):
            return RecognitionResult(None, None, 0.0)

        if not self.known_encodings:
            return RecognitionResult(None, None, 0.0)

        candidate_encoding = self.extract_encoding(face_image)
        if not candidate_encoding:
            return RecognitionResult(None, None, 0.0)

        candidate_encoding = np.array(candidate_encoding, dtype=np.float32)
        best_idx = None
        best_dist = float("inf")

        for idx, known_encoding in enumerate(self.known_encodings):
            try:
                known_vector = np.array(known_encoding, dtype=np.float32)
                if known_vector.shape != candidate_encoding.shape:
                    continue
                dist = np.linalg.norm(candidate_encoding - known_vector)
                if dist < best_dist:
                    best_dist = dist
                    best_idx = idx
            except Exception:
                continue

        if best_idx is None or best_dist > 0.7:
            return RecognitionResult(None, None, 0.0)

        confidence = max(0.0, min(1.0, 1.0 - best_dist / 0.8))
        return RecognitionResult(
            student_id=self.known_ids[best_idx],
            student_name=self.known_names[best_idx],
            confidence=round(confidence, 2)
        )


@dataclass
class RecognitionResult:
    student_id: Optional[int]
    student_name: Optional[str]
    confidence: float = 0.0


class CameraAnalyzer:
    def __init__(self):
        if CAMERA_AVAILABLE:
            # Memory va CPU ni tejash uchun model konfiguratsiyalari
            self.mp_face_mesh = mp_face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(max_num_faces=50, refine_landmarks=True)
            self.face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.3)
            self.pose_estimator = mp_pose.Pose()
            self.hands_estimator = mp_hands.Hands(max_num_hands=100) # Qo'l kuzatish qo'shildi
            
            self.blink_history = {}
            self.position_history = {}
            self.previous_student_count = 0
            
            # Keshlar va Frame Skipping optimizatsiyasi
            self.yolo_model = _yolo_model
            self.frame_count = 0
            self.cached_yolo_results = None
            self.cached_global_objects = []
            self.unknown_faces_count = 0
            
            # Parallel ishlash uchun ThreadPool (Maxsus har bir talaba yuzini parallel hisoblash)
            self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=8)

    def _analyze_environment(self, frame, yolo_results, face_centers, frame_width, frame_height) -> EnvironmentData:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness_level = (np.mean(gray) / 255.0) * 100.0
        
        noise_db = audio_analyzer.get_noise_level()
        yolo_people_count = sum(1 for r in yolo_results for box in r.boxes if int(box.cls[0]) == 0) if yolo_results else 0
        total_people_count = max(yolo_people_count, len(face_centers))

        ptz_suggestion = "center"
        if len(face_centers) > 0:
            avg_x, avg_y = np.mean([p[0] for p in face_centers]), np.mean([p[1] for p in face_centers])
            if avg_x < 0.3: ptz_suggestion = "pan_left"
            elif avg_x > 0.7: ptz_suggestion = "pan_right"
            elif avg_y < 0.3: ptz_suggestion = "tilt_up"
            elif avg_y > 0.7: ptz_suggestion = "tilt_down"

        return EnvironmentData(
            brightness_level=round(brightness_level, 2),
            low_light_warning=brightness_level < 30.0,
            noise_level_db=noise_db,
            high_noise_warning=noise_db > 70.0,
            total_people_count=total_people_count,
            ptz_suggestion=ptz_suggestion
        )

    def analyze_frame(self, frame) -> AttentionData:
        if not CAMERA_AVAILABLE: return self._demo_attention()
        
        start_time = time.perf_counter()
        self.frame_count += 1

        frame_height, frame_width, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        detection_results = self.face_detection.process(rgb_frame)
        
        students_count = len(detection_results.detections) if detection_results.detections else 0
        students_count_changed = students_count != self.previous_student_count
        if students_count > self.previous_student_count:
            self.unknown_faces_count = students_count - self.previous_student_count
        elif students_count < self.previous_student_count:
            self.unknown_faces_count = max(0, self.unknown_faces_count - 1)
        self.previous_student_count = students_count

        # YOLO Frame Skipping: CPU da ishlayotganda og'ir modelni har 5-kadrda chaqiramiz
        if self.yolo_model and (self.frame_count % 5 == 0 or self.cached_yolo_results is None):
            try:
                self.cached_yolo_results = self.yolo_model(frame, verbose=False, classes=[0, 67, 73, 74])
                self.cached_global_objects = []
                for r in self.cached_yolo_results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        if cls_id == 67: self.cached_global_objects.append("phone")
                        elif cls_id == 73 or cls_id == 74: self.cached_global_objects.append("laptop")
            except Exception: pass
            
        detected_global_objects = self.cached_global_objects
        yolo_results = self.cached_yolo_results

        mesh_results = self.face_mesh.process(rgb_frame)
        pose_results = self.pose_estimator.process(rgb_frame)

        attention_scores, behaviors, face_centers = [], [], []
        confusion_signals = 0
        standing_up_detected = False
        
        active_ids = set()
        
        # Parallel ishlash uchun lokal funksiya (Har o'quvchi xatti-harakatini 1 thread hisoblaydi)
        def process_student(idx, face_landmarks, current_time):
            # Asosiy xususiyatlarni ajratish
            nose = face_landmarks.landmark[4]
            center_coords = (nose.x, nose.y)

            eye_openness = self._calculate_eye_openness(face_landmarks)
            gaze = self._calculate_gaze_direction(face_landmarks)
            head_pose_dir = self._calculate_head_pose_advanced(face_landmarks)
            emotion = self._detect_emotion(face_landmarks, eye_openness)

            # Restlessness (Bezovtalik va tarix)
            r_score = 0.0
            is_standing = False
            hist = self.position_history.get(idx, [])
            hist.append((nose.x, nose.y, current_time))
            hist = [p for p in hist if current_time - p[2] < 2.0]
            
            if len(hist) > 5:
                xs, ys = [p[0] for p in hist], [p[1] for p in hist]
                var_x, var_y = np.var(xs), np.var(ys)
                r_score = min(1.0, (var_x + var_y) * 1500)
                if (ys[0] - ys[-1]) > 0.15: is_standing = True

            # Objects va Body
            using_phone = False
            u_objects = []
            if head_pose_dir == 'down' and gaze == 'down' and "phone" in detected_global_objects:
                using_phone, u_objects = True, ["phone"]
            if "laptop" in detected_global_objects: u_objects.append("laptop")

            b_posture = "straight"
            if pose_results and pose_results.pose_landmarks and idx == 0:
                shoulders_y = (pose_results.pose_landmarks.landmark[11].y + pose_results.pose_landmarks.landmark[12].y) / 2
                if (shoulders_y - pose_results.pose_landmarks.landmark[0].y) < 0.15: b_posture = "slouch"

            # Skoring (0-100)
            base_eye = 40.0 if gaze in ['screen', 'board', 'straight'] else 10.0
            eye_score = base_eye * eye_openness
            
            if head_pose_dir in ['straight', 'up']: head_score = 25.0
            elif head_pose_dir in ['left', 'right']: head_score = 15.0
            else: head_score = 5.0
            
            body_score = 20.0 if b_posture == 'straight' else 10.0
            action_score = 0.0 if using_phone else 15.0 * (1.0 - min(1.0, r_score))
            
            tot_score = int(eye_score + head_score + body_score + action_score)
            if emotion == 'fatigued': tot_score = int(tot_score * 0.7)
            tot_score = max(0, min(100, tot_score))
            
            # Status colors
            needs_screenshot = False
            if tot_score >= 70: s_color = 'green'
            elif tot_score >= 40: s_color = 'yellow'
            else: 
                s_color = 'red'
                needs_screenshot = True

            return {
                'idx': idx, 'center': center_coords, 'is_standing': is_standing,
                'is_open': eye_openness > 0.2, 'emotion': emotion, 'score': tot_score, 'r_score': r_score,
                'gaze': gaze, 'head_pose': head_pose_dir, 'body_posture': b_posture, 
                'using_phone': using_phone, 'u_objects': u_objects, 's_color': s_color, 
                'needs_screenshot': needs_screenshot, 'hist': hist
            }

        if mesh_results.multi_face_landmarks:
            current_time = time.time()
            futures = []
            
            # Multi-threading bilan paralel ishlash (har bir yuzni)
            for idx, face_landmarks in enumerate(mesh_results.multi_face_landmarks):
                active_ids.add(idx)
                futures.append(self.executor.submit(process_student, idx, face_landmarks, current_time))
            
            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                idx = res['idx']
                
                # Update Blink History
                if idx not in self.blink_history: self.blink_history[idx] = {'blinks': 0, 'last_state': True}
                if self.blink_history[idx]['last_state'] and not res['is_open']: self.blink_history[idx]['blinks'] += 1
                self.blink_history[idx]['last_state'] = res['is_open']
                
                # Update Position History
                self.position_history[idx] = res['hist']
                if res['is_standing']: standing_up_detected = True
                if res['emotion'] == 'confused': confusion_signals += 1

                attention_scores.append(res['score'])
                face_centers.append(res['center'])

                behaviors.append(StudentBehavior(
                    eye_gaze=res['gaze'], head_pose=res['head_pose'], body_posture=res['body_posture'],
                    emotion_state=res['emotion'], is_using_phone=res['using_phone'],
                    blink_rate=self.blink_history[idx]['blinks'], restlessness_score=round(res['r_score'], 2),
                    detected_objects=res['u_objects'],
                    attention_score=res['score'], status_color=res['s_color'], needs_screenshot=res['needs_screenshot']
                ))

        # Memory Cleanup (2GB dan oshib ketmasligi uchun saqlangan ID larni tozalash)
        keys_to_delete = [k for k in self.blink_history if k not in active_ids]
        for k in keys_to_delete:
            del self.blink_history[k]
            if k in self.position_history: del self.position_history[k]

        env_data = self._analyze_environment(frame, yolo_results, face_centers, frame_width, frame_height)

        avg_attention = np.mean(attention_scores) if attention_scores else 50.0
        confusion_ratio = confusion_signals / max(len(attention_scores), 1)

        recommendation = None
        if avg_attention < 40.0: recommendation = "polling"
        elif confusion_ratio > 0.5: recommendation = "wow_fact"
        elif standing_up_detected: recommendation = "interaction"
        elif env_data.low_light_warning: recommendation = "turn_on_lights"
        elif env_data.high_noise_warning: recommendation = "reduce_noise"

        latency_ms = (time.perf_counter() - start_time) * 1000

        return AttentionData(
            attention_level=round(float(avg_attention), 1),
            confusion_detected=confusion_ratio > 0.3, boredom_detected=float(avg_attention) < 40.0,
            students_count=students_count, students_count_changed=students_count_changed,
            standing_up_detected=standing_up_detected, unknown_faces_count=self.unknown_faces_count,
            environment=env_data, recommendation=recommendation, 
            processing_latency_ms=round(latency_ms, 2),
            behaviors=behaviors
        )

    # Internal calculations (qisqartirilgan, asosiy matematika)
    def _calculate_eye_openness(self, landmarks): return min(1.0, abs(landmarks.landmark[159].y - landmarks.landmark[145].y) * 10)
    
    def _calculate_gaze_direction(self, landmarks):
        if len(landmarks.landmark) > 468:
            w = abs(landmarks.landmark[133].x - landmarks.landmark[33].x)
            if w > 0:
                rx = (landmarks.landmark[468].x - landmarks.landmark[33].x) / w
                if rx < 0.35: return 'right'
                if rx > 0.65: return 'left'
            h = abs(landmarks.landmark[145].y - landmarks.landmark[159].y)
            if h > 0:
                ry = (landmarks.landmark[468].y - landmarks.landmark[159].y) / h
                if ry > 0.7: return 'down'
                if ry < 0.3: return 'up'
        return 'screen'

    def _calculate_head_pose_advanced(self, landmarks):
        nose, l_cheek, r_cheek = landmarks.landmark[4], landmarks.landmark[234], landmarks.landmark[454]
        if abs(nose.x - l_cheek.x) > abs(r_cheek.x - nose.x) * 2.0: return 'left'
        if abs(r_cheek.x - nose.x) > abs(nose.x - l_cheek.x) * 2.0: return 'right'
        if abs(nose.y - landmarks.landmark[10].y) > abs(landmarks.landmark[152].y - nose.y) * 1.5: return 'down'
        if abs(landmarks.landmark[152].y - nose.y) > abs(nose.y - landmarks.landmark[10].y) * 1.5: return 'up'
        return 'straight'

    def _detect_emotion(self, landmarks, eye_openness):
        mouth_open = abs(landmarks.landmark[14].y - landmarks.landmark[13].y) > 0.05
        if abs(landmarks.landmark[70].y - landmarks.landmark[300].y) > 0.02 and not mouth_open: return 'confused'
        if eye_openness < 0.3: return 'fatigued'
        if mouth_open and eye_openness > 0.7: return 'surprised'
        return 'neutral'

    def _demo_attention(self):
        env = EnvironmentData(
            brightness_level=round(random.uniform(40.0, 90.0), 2), low_light_warning=False,
            noise_level_db=audio_analyzer.get_noise_level(), high_noise_warning=False,
            total_people_count=random.randint(10, 20), ptz_suggestion="center"
        )
        score = random.randint(30, 95)
        color = 'green' if score >= 70 else ('yellow' if score >= 40 else 'red')
        behaviors = [
            StudentBehavior(
                eye_gaze=random.choice(['screen', 'board', 'down']),
                head_pose=random.choice(['straight', 'down', 'left']),
                body_posture=random.choice(['straight', 'slouch']),
                emotion_state=random.choice(['neutral', 'confused', 'fatigued']),
                is_using_phone=random.random() < 0.1,
                blink_rate=random.randint(10, 25),
                restlessness_score=round(random.uniform(0.0, 0.5), 2),
                detected_objects=[], attention_score=score, status_color=color, needs_screenshot=(color == 'red')
            ) for _ in range(random.randint(2, 5))
        ]
        return AttentionData(
            attention_level=score, confusion_detected=False, boredom_detected=False,
            students_count=env.total_people_count, students_count_changed=False,
            standing_up_detected=False, unknown_faces_count=0, environment=env,
            recommendation=None, processing_latency_ms=round(random.uniform(10.0, 45.0), 2), behaviors=behaviors
        )


camera = CameraAnalyzer()

async def get_realtime_attention(camera_index: int = 0):
    if not CAMERA_AVAILABLE:
        while True:
            yield camera._demo_attention().__dict__
            await asyncio.sleep(2)
        return

    cap = cv2.VideoCapture(camera_index)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            data = camera.analyze_frame(frame)
            result = data.__dict__.copy()
            result['behaviors'] = [b.__dict__ for b in data.behaviors]
            result['environment'] = data.environment.__dict__
            
            yield result
            # Yuqori FPS ta'minlash va Socket orqali muloqot balansi
            await asyncio.sleep(0.5) 
    finally:
        cap.release()
