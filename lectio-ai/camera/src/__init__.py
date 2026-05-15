"""
Lectio AI Camera System - Unified Production Architecture
Enterprise-grade real-time AI camera monitoring system

Modules:
- config: Centralized configuration management
- detection: Unified face detection (YOLO, MediaPipe, etc.)
- tracking: Advanced multi-person tracking with ReID
- recognition: Face recognition and identity management
- camera: Multi-camera capture and management
- pipeline: Async processing pipeline with queues
- rendering: Modern UI overlay and visualization
- networking: WebSocket and streaming
- utils: Common utilities and helpers
"""

__version__ = "4.0.0"
__author__ = "Lectio AI Team"

from .config import Config, CameraConfig, ModelConfig
from .detection import FaceDetector, DetectionResult
from .tracking import MultiObjectTracker, Track
from .recognition import FaceRecognizer, IdentityDatabase
from .camera import CameraManager, CameraSource
from .pipeline import ProcessingPipeline, PipelineStage
from .rendering import OverlayRenderer, RenderConfig

__all__ = [
    "Config",
    "CameraConfig",
    "ModelConfig",
    "FaceDetector",
    "DetectionResult",
    "MultiObjectTracker",
    "Track",
    "FaceRecognizer",
    "IdentityDatabase",
    "CameraManager",
    "CameraSource",
    "ProcessingPipeline",
    "PipelineStage",
    "OverlayRenderer",
    "RenderConfig",
]
