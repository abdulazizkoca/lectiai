"""
Centralized Configuration System
Unified configuration management for all camera system components
"""

import os
import json
import yaml
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class CameraConfig:
    """Camera configuration"""
    id: str = "main"
    type: str = "usb"  # usb, ip, rtsp, cctv
    source: str = "0"  # Device index or URL
    width: int = 1280
    height: int = 720
    fps: int = 30
    buffer_size: int = 5
    reconnect_attempts: int = 5
    reconnect_delay: float = 2.0
    username: Optional[str] = None
    password: Optional[str] = None
    calibration_file: Optional[str] = None


@dataclass
class ModelConfig:
    """AI model configuration"""
    # Detection
    detector_backend: str = "yolov8"
    detector_model: str = "yolov8n-face.pt"
    confidence_threshold: float = 0.5
    nms_threshold: float = 0.4
    max_detections: int = 50
    
    # Tracking
    tracker_algorithm: str = "bytetrack"
    max_age: int = 30
    min_hits: int = 3
    track_threshold: float = 0.6
    match_threshold: float = 0.8
    
    # Recognition
    recognition_enabled: bool = False
    recognition_model: str = "arcface"
    similarity_threshold: float = 0.6
    recognition_tolerance: float = 0.6
    
    # Pose
    pose_enabled: bool = True
    pose_method: str = "landmarks"
    
    # Performance
    use_tensorrt: bool = False
    use_onnx: bool = True
    fp16: bool = True
    batch_size: int = 1
    device: str = "auto"  # auto, cuda, cpu


@dataclass
class PipelineConfig:
    """Processing pipeline configuration"""
    mode: str = "balanced"  # economy, balanced, quality, maximum
    target_fps: float = 30.0
    detection_interval: int = 1
    enable_tracking: bool = True
    enable_recognition: bool = False
    enable_pose: bool = True
    enable_analytics: bool = True
    queue_size: int = 10
    num_workers: int = 2
    adaptive_processing: bool = True


@dataclass
class RenderConfig:
    """Rendering/UI configuration"""
    theme: str = "dark"
    show_labels: bool = True
    show_analytics: bool = True
    show_heatmap: bool = False
    show_debug: bool = False
    font_scale: float = 0.5
    line_thickness: int = 2
    overlay_alpha: float = 0.7


@dataclass
class NetworkConfig:
    """Network/WebSocket configuration"""
    enabled: bool = True
    host: str = "0.0.0.0"
    port: int = 8080
    ws_path: str = "/ws"
    stream_protocol: str = "mjpeg"  # mjpeg, webrtc
    stream_quality: int = 80
    compression: bool = True
    max_clients: int = 10


@dataclass
class OutputConfig:
    """Output configuration"""
    display: bool = True
    save_video: bool = False
    video_format: str = "mp4"
    video_quality: str = "high"
    save_data: bool = True
    data_format: str = "json"
    output_dir: str = "./output"
    log_level: str = "INFO"


@dataclass
class Config:
    """Main configuration class"""
    system_name: str = "Lectio AI Camera System"
    version: str = "4.0.0"
    environment: str = "production"  # development, production
    
    cameras: List[CameraConfig] = field(default_factory=lambda: [CameraConfig()])
    model: ModelConfig = field(default_factory=ModelConfig)
    pipeline: PipelineConfig = field(default_factory=PipelineConfig)
    render: RenderConfig = field(default_factory=RenderConfig)
    network: NetworkConfig = field(default_factory=NetworkConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    
    @classmethod
    def from_file(cls, filepath: str) -> "Config":
        """Load configuration from file"""
        path = Path(filepath)
        
        if not path.exists():
            logger.warning(f"Config file not found: {filepath}, using defaults")
            return cls()
        
        try:
            with open(path, 'r') as f:
                if path.suffix == '.json':
                    data = json.load(f)
                elif path.suffix in ['.yml', '.yaml']:
                    data = yaml.safe_load(f)
                else:
                    raise ValueError(f"Unsupported config format: {path.suffix}")
            
            # Parse nested dataclasses
            config = cls()
            
            if 'cameras' in data:
                config.cameras = [CameraConfig(**c) for c in data['cameras']]
            if 'model' in data:
                config.model = ModelConfig(**data['model'])
            if 'pipeline' in data:
                config.pipeline = PipelineConfig(**data['pipeline'])
            if 'render' in data:
                config.render = RenderConfig(**data['render'])
            if 'network' in data:
                config.network = NetworkConfig(**data['network'])
            if 'output' in data:
                config.output = OutputConfig(**data['output'])
            
            logger.info(f"Configuration loaded from {filepath}")
            return config
            
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return cls()
    
    def to_file(self, filepath: str):
        """Save configuration to file"""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        data = asdict(self)
        
        with open(path, 'w') as f:
            if path.suffix == '.json':
                json.dump(data, f, indent=2)
            elif path.suffix in ['.yml', '.yaml']:
                yaml.dump(data, f, default_flow_style=False)
        
        logger.info(f"Configuration saved to {filepath}")
    
    def create_default(self, filepath: str = "config.yaml"):
        """Create default configuration file"""
        default_config = Config()
        default_config.to_file(filepath)
        logger.info(f"Default configuration created: {filepath}")
    
    def get_camera(self, camera_id: str) -> Optional[CameraConfig]:
        """Get camera configuration by ID"""
        for cam in self.cameras:
            if cam.id == camera_id:
                return cam
        return None
    
    def update_from_env(self):
        """Update configuration from environment variables"""
        # Camera settings
        if os.getenv('CAMERA_FPS'):
            for cam in self.cameras:
                cam.fps = int(os.getenv('CAMERA_FPS'))
        
        if os.getenv('CAMERA_RESOLUTION'):
            w, h = map(int, os.getenv('CAMERA_RESOLUTION').split('x'))
            for cam in self.cameras:
                cam.width, cam.height = w, h
        
        # Model settings
        if os.getenv('DETECTOR_BACKEND'):
            self.model.detector_backend = os.getenv('DETECTOR_BACKEND')
        
        if os.getenv('USE_TENSORRT'):
            self.model.use_tensorrt = os.getenv('USE_TENSORRT').lower() == 'true'
        
        # Pipeline settings
        if os.getenv('TARGET_FPS'):
            self.pipeline.target_fps = float(os.getenv('TARGET_FPS'))
        
        if os.getenv('NUM_WORKERS'):
            self.pipeline.num_workers = int(os.getenv('NUM_WORKERS'))
        
        logger.info("Configuration updated from environment variables")


# Global config instance
_global_config: Optional[Config] = None


def get_config() -> Config:
    """Get global configuration instance"""
    global _global_config
    if _global_config is None:
        _global_config = Config()
    return _global_config


def set_config(config: Config):
    """Set global configuration instance"""
    global _global_config
    _global_config = config


def load_config(filepath: str = "config.yaml") -> Config:
    """Load and set global configuration"""
    config = Config.from_file(filepath)
    config.update_from_env()
    set_config(config)
    return config
