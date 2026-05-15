"""
Async Processing Pipeline
Queue-based frame processing with multi-threading support
"""

import threading
import queue
import time
from typing import Optional, Dict, List, Any, Callable, Tuple
from dataclasses import dataclass, field
from collections import deque
from enum import Enum
import logging
import numpy as np

from .config import PipelineConfig, get_config
from .detection import FaceDetector, DetectionResult
from .tracking import MultiObjectTracker, Track
from .recognition import FaceRecognizer, RecognitionResult
from .camera import FrameData

logger = logging.getLogger(__name__)


class PipelineStage(Enum):
    """Processing pipeline stages"""
    CAPTURE = "capture"
    DETECTION = "detection"
    TRACKING = "tracking"
    RECOGNITION = "recognition"
    ANALYTICS = "analytics"
    RENDERING = "rendering"
    OUTPUT = "output"


@dataclass
class ProcessingResult:
    """Result of processing a frame"""
    camera_id: str
    frame: np.ndarray
    timestamp: float
    
    # Detection results
    detections: List[DetectionResult] = field(default_factory=list)
    tracks: List[Track] = field(default_factory=list)
    
    # Analytics
    student_count: int = 0
    avg_attention: float = 0.0
    distracted_count: int = 0
    
    # Performance
    processing_time_ms: float = 0.0
    stage_times: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "camera_id": self.camera_id,
            "timestamp": self.timestamp,
            "student_count": self.student_count,
            "avg_attention": self.avg_attention,
            "processing_time_ms": self.processing_time_ms,
            "tracks": [t.to_dict() for t in self.tracks]
        }


class ProcessingPipeline:
    """
    Async processing pipeline with queue-based architecture
    
    Features:
    - Multi-threaded processing
    - Stage-based pipeline
    - Adaptive frame skipping
    - Performance monitoring
    """
    
    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or get_config().pipeline
        
        # Components
        self.detector: Optional[FaceDetector] = None
        self.tracker: Optional[MultiObjectTracker] = None
        self.recognizer: Optional[FaceRecognizer] = None
        
        # Queues for pipeline stages
        self.input_queue: queue.Queue = queue.Queue(maxsize=self.config.queue_size)
        self.output_queue: queue.Queue = queue.Queue(maxsize=self.config.queue_size)
        
        # Worker threads
        self.workers: List[threading.Thread] = []
        self.is_running = False
        self.stop_event = threading.Event()
        self.processing_lock = threading.Lock()
        
        # Performance tracking
        self.frame_times: deque = deque(maxlen=100)
        self.stage_times: Dict[str, List[float]] = {
            stage.value: [] for stage in PipelineStage
        }
        
        # Adaptive processing
        self.current_fps = 0.0
        self.skip_counter = 0
        self.frame_counter = 0
        self.current_detection_interval = max(1, self.config.detection_interval)
        
        # Callbacks
        self.on_result: Optional[Callable[[ProcessingResult], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
    
    def load_known_faces(self, faces_data: List[Dict[str, Any]]):
        """Load known faces for recognition"""
        if self.recognizer:
            self.recognizer.load_known_faces(faces_data)
            logger.info(f"Loaded {len(faces_data)} known faces for recognition")
    
    def initialize(self) -> bool:
        """Initialize pipeline components"""
        try:
            logger.info("Initializing processing pipeline...")
            
            # Initialize detector
            cfg = get_config()
            self.detector = FaceDetector(
                backend=cfg.model.detector_backend,
                confidence_threshold=cfg.model.confidence_threshold,
                max_detections=cfg.model.max_detections,
                device=cfg.model.device,
                model_path=cfg.model.detector_model
            )
            
            # Initialize tracker
            self.tracker = MultiObjectTracker(
                max_age=cfg.model.max_age,
                min_hits=cfg.model.min_hits,
                use_appearance=True,
                use_motion_prediction=True
            )
            
            # Initialize recognizer
            self.recognizer = FaceRecognizer(tolerance=cfg.model.recognition_tolerance)
            
            logger.info("Pipeline initialized successfully")
            return True
            
        except Exception as e:
            logger.exception("Pipeline initialization failed")
            return False
    
    def start(self) -> bool:
        """Start processing workers"""
        if not self.initialize():
            return False
        
        if self.is_running:
            return True
        
        self.is_running = True
        self.stop_event.clear()
        
        # Start worker threads
        for i in range(self.config.num_workers):
            worker = threading.Thread(
                target=self._processing_worker,
                args=(i,),
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
        
        logger.info(f"Processing pipeline started with {self.config.num_workers} workers")
        return True
    
    def stop(self):
        """Stop processing workers"""
        if not self.is_running:
            return
        
        logger.info("Stopping processing pipeline...")
        self.is_running = False
        self.stop_event.set()
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=3.0)
        self.workers.clear()
        
        # Clear queues
        self._clear_queues()
        
        # Release components
        if self.detector:
            self.detector.release()
        
        logger.info("Processing pipeline stopped")
    
    def _clear_queues(self):
        """Clear all queues"""
        for q in [self.input_queue, self.output_queue]:
            while not q.empty():
                try:
                    q.get_nowait()
                except queue.Empty:
                    break
    
    def _processing_worker(self, worker_id: int):
        """Processing worker thread"""
        logger.info(f"Worker {worker_id} started")
        
        while not self.stop_event.is_set():
            try:
                # Get frame from input queue
                frame_data = self.input_queue.get(timeout=1.0)
                
                # Detector, tracker and recognizer instances keep mutable state,
                # so process frames one at a time even when ingestion is threaded.
                with self.processing_lock:
                    result = self._process_frame(frame_data)
                
                # Put result in output queue
                try:
                    self.output_queue.put_nowait(result)
                except queue.Full:
                    pass
                
                # Trigger callback
                if self.on_result:
                    try:
                        self.on_result(result)
                    except Exception as e:
                        logger.warning(f"Result callback error: {e}")
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                if self.on_error:
                    self.on_error(e)
        
        logger.info(f"Worker {worker_id} stopped")
    
    def _process_frame(self, frame_data: FrameData) -> ProcessingResult:
        """Process a single frame through the pipeline"""
        start_time = time.time()
        stage_times = {}
        
        frame = frame_data.image
        
        # Stage 1: Detection
        det_start = time.time()
        detections = []
        
        should_detect = self._should_detect()
        if should_detect and self.detector:
            detections = self.detector.detect(frame)
        stage_times["detection"] = (time.time() - det_start) * 1000
        
        # Stage 2: Tracking
        track_start = time.time()
        tracks = []
        if self.tracker:
            # Extract embeddings for ReID if needed
            embeddings = None
            if self.config.enable_recognition:
                embeddings = self._extract_embeddings(frame, detections)
            
            tracks = self.tracker.update(detections, embeddings)
        stage_times["tracking"] = (time.time() - track_start) * 1000
        
        # Stage 3: Recognition
        recognition_start = time.time()
        if self.recognizer and self.config.enable_recognition:
            for track in tracks:
                # Find corresponding detection
                for det in detections:
                    if (track.bbox[0] >= det.bbox[0] - 10 and 
                        track.bbox[1] >= det.bbox[1] - 10 and
                        track.bbox[2] <= det.bbox[2] + 10 and 
                        track.bbox[3] <= det.bbox[3] + 10):
                        # Crop face
                        x1, y1, x2, y2 = self._clip_bbox(det.bbox, frame.shape)
                        face_crop = frame[y1:y2, x1:x2]
                        
                        if face_crop.size > 0:
                            # Recognize face
                            result = self.recognizer.recognize_face(face_crop)
                            if result.student_id:
                                track.student_id = result.student_id
                                track.student_name = result.student_name
                                track.recognition_confidence = result.confidence
                        break
        stage_times["recognition"] = (time.time() - recognition_start) * 1000
        
        # Stage 4: Analytics
        analytics_start = time.time()
        student_count = len(tracks)
        avg_attention = 0.0
        distracted_count = 0
        
        if tracks:
            attention_scores = []
            for track in tracks:
                # Simple attention estimation
                if track.is_occluded:
                    score = 0.3
                else:
                    score = min(1.0, track.hits / 10)
                attention_scores.append(score)
                
                if score < 0.4:
                    distracted_count += 1
            
            avg_attention = sum(attention_scores) / len(attention_scores)
        stage_times["analytics"] = (time.time() - analytics_start) * 1000
        
        # Calculate total time
        total_time = (time.time() - start_time) * 1000
        
        # Update performance tracking
        self.frame_times.append(total_time)
        for stage, t in stage_times.items():
            self.stage_times[stage].append(t)
            if len(self.stage_times[stage]) > 300:
                self.stage_times[stage] = self.stage_times[stage][-300:]
        
        # Update FPS
        self.current_fps = 1000.0 / max(total_time, 1.0)
        
        return ProcessingResult(
            camera_id=frame_data.camera_id,
            frame=frame,
            timestamp=frame_data.timestamp,
            detections=detections,
            tracks=tracks,
            student_count=student_count,
            avg_attention=avg_attention,
            distracted_count=distracted_count,
            processing_time_ms=total_time,
            stage_times=stage_times
        )
    
    def _should_detect(self) -> bool:
        """Determine if detection should run this frame"""
        if not self.config.adaptive_processing:
            return True
        
        self.frame_counter += 1
        
        # Get current detection interval
        interval = self.current_detection_interval
        
        # Adaptive adjustment based on FPS
        if len(self.frame_times) >= 10:
            avg_time = np.mean(list(self.frame_times)[-10:])
            target_time = 1000.0 / self.config.target_fps
            
            if avg_time > target_time * 1.2:
                # Running slow, increase interval
                interval = min(interval + 1, 5)
            elif avg_time < target_time * 0.8 and interval > 1:
                # Running fast, decrease interval
                interval = max(interval - 1, 1)

        self.current_detection_interval = interval
        
        return self.frame_counter % interval == 0
    
    def _extract_embeddings(
        self,
        frame: np.ndarray,
        detections: List[DetectionResult]
    ) -> List[Optional[np.ndarray]]:
        """Extract face embeddings for ReID"""
        embeddings = []
        
        for det in detections:
            x1, y1, x2, y2 = self._clip_bbox(det.bbox, frame.shape)
            face_crop = frame[y1:y2, x1:x2]
            
            if face_crop.size > 0 and self.recognizer:
                try:
                    embedding = self.recognizer.register_face(face_crop)
                    if embedding is not None:
                        embeddings.append(np.asarray(embedding, dtype=np.float32))
                        continue
                except Exception as e:
                    logger.debug(f"Embedding extraction failed: {e}")
            embeddings.append(None)
        
        return embeddings

    def _clip_bbox(
        self,
        bbox: Tuple[float, float, float, float],
        frame_shape: Tuple[int, ...]
    ) -> Tuple[int, int, int, int]:
        """Clamp a bounding box to valid frame coordinates."""
        height, width = frame_shape[:2]
        x1, y1, x2, y2 = (int(round(v)) for v in bbox)
        x1 = max(0, min(width, x1))
        y1 = max(0, min(height, y1))
        x2 = max(0, min(width, x2))
        y2 = max(0, min(height, y2))
        return x1, y1, x2, y2
    
    def submit_frame(self, frame_data: FrameData) -> bool:
        """Submit frame for processing"""
        if not self.is_running:
            return False
        
        try:
            self.input_queue.put_nowait(frame_data)
            return True
        except queue.Full:
            logger.warning("Input queue full, frame dropped")
            return False
    
    def get_result(self, timeout: float = 0.1) -> Optional[ProcessingResult]:
        """Get processed result"""
        try:
            return self.output_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics"""
        stats = {
            "is_running": self.is_running,
            "input_queue_size": self.input_queue.qsize(),
            "output_queue_size": self.output_queue.qsize(),
            "current_fps": self.current_fps,
            "detection_interval": self.current_detection_interval,
            "avg_processing_time_ms": float(np.mean(self.frame_times)) if self.frame_times else 0,
            "detector": self.detector.get_stats() if self.detector else None,
            "tracker": self.tracker.get_stats() if self.tracker else None,
            "stage_times": {
                stage: float(np.mean(times[-30:])) if times else 0
                for stage, times in self.stage_times.items()
            }
        }
        
        return stats
    
    def warmup(self, num_frames: int = 5):
        """Warmup pipeline with dummy frames"""
        logger.info(f"Warming up pipeline with {num_frames} frames...")
        
        dummy = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        for _ in range(num_frames):
            frame_data = FrameData(
                image=dummy,
                timestamp=time.time(),
                frame_number=0,
                fps=30.0,
                camera_id="warmup",
                latency_ms=0.0
            )
            self._process_frame(frame_data)
        
        logger.info("Pipeline warmup complete")
