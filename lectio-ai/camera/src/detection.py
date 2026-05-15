"""
Unified Face Detection Module
Optimized multi-backend face detection with automatic fallback
"""

import cv2
import numpy as np
import torch
from typing import List, Tuple, Optional, Dict, Any, Union
from dataclasses import dataclass, field
from enum import Enum, auto
from abc import ABC, abstractmethod
from pathlib import Path
import time
import logging

logger = logging.getLogger(__name__)


class DetectionBackend(Enum):
    """Supported detection backends"""
    AUTO = auto()
    YOLOV8 = auto()
    YOLOV10 = auto()
    YOLOV11 = auto()
    MEDIAPIPE = auto()
    OPENCV_DNN = auto()


@dataclass
class DetectionResult:
    """Unified detection result"""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    keypoints: Optional[np.ndarray] = None
    embedding: Optional[np.ndarray] = None
    face_id: Optional[int] = None
    track_id: Optional[int] = None
    
    # Metadata
    detection_time_ms: float = 0.0
    backend: str = "unknown"
    
    @property
    def center(self) -> Tuple[float, float]:
        return ((self.bbox[0] + self.bbox[2]) / 2, (self.bbox[1] + self.bbox[3]) / 2)
    
    @property
    def width(self) -> int:
        return self.bbox[2] - self.bbox[0]
    
    @property
    def height(self) -> int:
        return self.bbox[3] - self.bbox[1]
    
    @property
    def area(self) -> int:
        return self.width * self.height
    
    def to_dict(self) -> Dict:
        return {
            "bbox": self.bbox,
            "confidence": self.confidence,
            "center": self.center,
            "width": self.width,
            "height": self.height,
            "face_id": self.face_id,
            "track_id": self.track_id,
            "backend": self.backend
        }


class BaseDetector(ABC):
    """Abstract base class for all detectors"""
    
    def __init__(
        self,
        confidence_threshold: float = 0.5,
        nms_threshold: float = 0.4,
        max_detections: int = 50,
        device: str = "auto"
    ):
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        self.max_detections = max_detections
        self.device = self._get_device(device)
        self.is_loaded = False
        
    def _get_device(self, device: str) -> str:
        """Determine compute device"""
        if device == "auto":
            return "cuda" if torch.cuda.is_available() else "cpu"
        return device
    
    @abstractmethod
    def load(self) -> bool:
        """Load detection model"""
        pass
    
    @abstractmethod
    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        """Run detection on frame"""
        pass
    
    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess frame (can be overridden)"""
        return frame
    
    def unload(self):
        """Unload model and free resources"""
        self.is_loaded = False


class YOLODetector(BaseDetector):
    """YOLO family detector (v8, v10, v11)"""
    
    def __init__(
        self,
        version: str = "v8",
        model_size: str = "n",  # n, s, m, l, x
        model_path: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.version = version
        self.model_size = model_size
        self.model_path = model_path
        self.model = None
        self.model_name = f"yolo{version}{model_size}"
        self.loaded_model_name = None
        
    def load(self) -> bool:
        """Load YOLO model"""
        try:
            from ultralytics import YOLO
            
            model_source = self.model_path or f"{self.model_name}.pt"
            tried_default = False
            
            try:
                self.model = YOLO(model_source)
                self.loaded_model_name = model_source
            except Exception as e:
                logger.warning(f"Failed loading configured model {model_source}: {e}")
                default_source = f"{self.model_name}.pt"
                if default_source != model_source:
                    tried_default = True
                    try:
                        self.model = YOLO(default_source)
                        self.loaded_model_name = default_source
                    except Exception as e2:
                        logger.info(f"Downloading fallback model {default_source}...")
                        self.model = YOLO(f"yolov8{self.model_size}.pt")
                        self.loaded_model_name = f"yolov8{self.model_size}.pt"
                else:
                    self.model = YOLO(f"yolov8{self.model_size}.pt")
                    self.loaded_model_name = f"yolov8{self.model_size}.pt"
            
            self.model.to(self.device)
            
            # Warmup
            dummy = torch.zeros(1, 3, 640, 640).to(self.device)
            for _ in range(3):
                with torch.no_grad():
                    self.model.predict(dummy, verbose=False)
            
            self.is_loaded = True
            logger.info(f"YOLO detector loaded: {self.loaded_model_name} on {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load YOLO: {e}")
            return False
    
    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        """Run YOLO detection"""
        if not self.is_loaded:
            if not self.load():
                return []
        
        start_time = time.time()
        
        results = self.model(
            frame,
            conf=self.confidence_threshold,
            iou=self.nms_threshold,
            max_det=self.max_detections,
            verbose=False,
            device=self.device
        )
        
        detections = []
        for result in results:
            if result.boxes is None:
                continue
            
            boxes = result.boxes.cpu().numpy()
            
            for i, (box, conf, cls) in enumerate(zip(boxes.xyxy, boxes.conf, boxes.cls)):
                x1, y1, x2, y2 = map(int, box[:4])
                
                # Get keypoints if available
                keypoints = None
                if hasattr(result, 'keypoints') and result.keypoints is not None:
                    if i < len(result.keypoints.xy):
                        keypoints = result.keypoints.xy[i].cpu().numpy()
                
                detection = DetectionResult(
                    bbox=(x1, y1, x2, y2),
                    confidence=float(conf),
                    keypoints=keypoints,
                    detection_time_ms=(time.time() - start_time) * 1000,
                    backend=self.model_name
                )
                detections.append(detection)
        
        return detections


class MediaPipeDetector(BaseDetector):
    """MediaPipe face detection - CPU friendly"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.detector = None
        
    def load(self) -> bool:
        """Load MediaPipe detector"""
        try:
            import mediapipe as mp
            
            self.mp_face_detection = mp.solutions.face_detection
            self.detector = self.mp_face_detection.FaceDetection(
                model_selection=1,  # Full range
                min_detection_confidence=self.confidence_threshold
            )
            
            self.is_loaded = True
            logger.info("MediaPipe detector loaded")
            return True
            
        except ImportError:
            logger.error("MediaPipe not installed")
            return False
    
    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        """Run MediaPipe detection"""
        if not self.is_loaded:
            if not self.load():
                return []
        
        start_time = time.time()
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process
        results = self.detector.process(rgb)
        detections = []
        
        if results.detections:
            h, w = frame.shape[:2]
            
            for detection in results.detections:
                score = detection.score[0]
                if score < self.confidence_threshold:
                    continue
                
                # Get bounding box
                bbox = detection.location_data.relative_bounding_box
                x1 = int(bbox.xmin * w)
                y1 = int(bbox.ymin * h)
                x2 = int((bbox.xmin + bbox.width) * w)
                y2 = int((bbox.ymin + bbox.height) * h)
                
                # Get keypoints
                keypoints = []
                for kp in detection.location_data.relative_keypoints:
                    keypoints.append([int(kp.x * w), int(kp.y * h)])
                
                detection_result = DetectionResult(
                    bbox=(max(0, x1), max(0, y1), min(w, x2), min(h, y2)),
                    confidence=score,
                    keypoints=np.array(keypoints) if keypoints else None,
                    detection_time_ms=(time.time() - start_time) * 1000,
                    backend="mediapipe"
                )
                detections.append(detection_result)
        
        return detections[:self.max_detections]
    
    def unload(self):
        """Unload MediaPipe"""
        if self.detector:
            self.detector.close()
        super().unload()


class FaceDetector:
    """
    Unified face detector with automatic backend selection and fallback
    """
    
    def __init__(
        self,
        backend: Union[DetectionBackend, str] = DetectionBackend.AUTO,
        confidence_threshold: float = 0.5,
        max_detections: int = 50,
        device: str = "auto",
        model_path: Optional[str] = None,
        enable_fallback: bool = True
    ):
        self.backend_type = backend if isinstance(backend, DetectionBackend) else DetectionBackend[backend.upper()]
        self.confidence_threshold = confidence_threshold
        self.max_detections = max_detections
        self.device = device
        self.model_path = model_path
        self.enable_fallback = enable_fallback
        
        # Primary and backup detectors
        self.primary_detector: Optional[BaseDetector] = None
        self.backup_detector: Optional[BaseDetector] = None
        self.current_detector: Optional[BaseDetector] = None
        
        # Performance tracking
        self.detection_times: List[float] = []
        self.success_count = 0
        self.failure_count = 0
        
        self._initialize()
    
    def _initialize(self):
        """Initialize detectors"""
        # Determine backend if auto
        if self.backend_type == DetectionBackend.AUTO:
            if torch.cuda.is_available():
                self.backend_type = DetectionBackend.YOLOV8
            else:
                self.backend_type = DetectionBackend.MEDIAPIPE
        
        # Initialize primary
        self._init_primary()
        
        # Initialize backup (MediaPipe is most reliable)
        if self.enable_fallback and not isinstance(self.primary_detector, MediaPipeDetector):
            self.backup_detector = MediaPipeDetector(
                confidence_threshold=self.confidence_threshold,
                max_detections=self.max_detections
            )
            self.backup_detector.load()
        
        self.current_detector = self.primary_detector if self.primary_detector else self.backup_detector
    
    def _init_primary(self):
        """Initialize primary detector"""
        try:
            if self.backend_type in [DetectionBackend.YOLOV8, DetectionBackend.YOLOV10, DetectionBackend.YOLOV11]:
                version = self.backend_type.name.lower().replace("yolo", "v")
                model_size = "n"
                if self.model_path:
                    import re
                    match = re.search(r"yolov(?:8|10|11)([nsmlx])", self.model_path.lower())
                    if match:
                        model_size = match.group(1)
                self.primary_detector = YOLODetector(
                    version=version,
                    model_size=model_size,
                    model_path=self.model_path,
                    confidence_threshold=self.confidence_threshold,
                    max_detections=self.max_detections,
                    device=self.device
                )
                
            elif self.backend_type == DetectionBackend.MEDIAPIPE:
                self.primary_detector = MediaPipeDetector(
                    confidence_threshold=self.confidence_threshold,
                    max_detections=self.max_detections
                )
            
            if self.primary_detector:
                self.primary_detector.load()
                
        except Exception as e:
            logger.warning(f"Primary detector initialization failed: {e}")
            self.primary_detector = None
    
    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        """
        Detect faces with automatic fallback
        
        Args:
            frame: Input image (BGR format)
            
        Returns:
            List of detection results
        """
        if frame is None or frame.size == 0:
            return []
        
        start_time = time.time()
        detections = []
        
        # Try primary detector
        if self.current_detector and self.current_detector.is_loaded:
            try:
                detections = self.current_detector.detect(frame)
                if len(detections) > 0:
                    self.success_count += 1
            except Exception as e:
                logger.warning(f"Detection failed: {e}")
                self.failure_count += 1
        
        # Fallback if needed
        if len(detections) == 0 and self.backup_detector and self.backup_detector.is_loaded:
            if self.current_detector != self.backup_detector:
                logger.info("Switching to backup detector")
                self.current_detector = self.backup_detector
            
            try:
                detections = self.backup_detector.detect(frame)
            except Exception as e:
                logger.error(f"Backup detection failed: {e}")
        
        # Track performance
        elapsed = (time.time() - start_time) * 1000
        self.detection_times.append(elapsed)
        if len(self.detection_times) > 100:
            self.detection_times.pop(0)
        
        return detections[:self.max_detections]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get detector statistics"""
        total_attempts = self.success_count + self.failure_count
        
        return {
            "backend": self.backend_type.name,
            "current_detector": type(self.current_detector).__name__ if self.current_detector else None,
            "avg_detection_time_ms": np.mean(self.detection_times) if self.detection_times else 0,
            "success_rate": self.success_count / max(1, total_attempts),
            "total_detections": self.success_count,
            "device": self.device
        }
    
    def warmup(self, num_iterations: int = 5):
        """Warmup detector with dummy frames"""
        dummy = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        for _ in range(num_iterations):
            self.detect(dummy)
        
        logger.info(f"Detector warmup complete: {num_iterations} iterations")
    
    def release(self):
        """Release all resources"""
        if self.primary_detector:
            self.primary_detector.unload()
        if self.backup_detector:
            self.backup_detector.unload()
        logger.info("Detector resources released")
