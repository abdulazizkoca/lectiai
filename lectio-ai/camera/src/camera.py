"""
Unified Camera Management Module
Multi-camera support with automatic reconnection and frame synchronization
"""

import os
import cv2
import numpy as np
import threading
import queue
import time
from typing import Dict, List, Tuple, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class CameraState(Enum):
    """Camera connection state"""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"
    RECONNECTING = "reconnecting"


@dataclass
class FrameData:
    """Frame with metadata"""
    image: np.ndarray
    timestamp: float
    frame_number: int
    fps: float
    camera_id: str
    latency_ms: float


class CameraSource:
    """
    Unified camera source supporting USB, IP, and RTSP cameras
    """
    
    def __init__(
        self,
        camera_id: str,
        source: str,
        width: int = 1280,
        height: int = 720,
        fps: int = 30,
        buffer_size: int = 5,
        reconnect_attempts: int = 5,
        reconnect_delay: float = 2.0
    ):
        self.camera_id = camera_id
        self.source = source  # Device index or URL
        self.width = width
        self.height = height
        self.target_fps = fps
        self.buffer_size = buffer_size
        self.reconnect_attempts = reconnect_attempts
        self.reconnect_delay = reconnect_delay
        
        # State
        self.state = CameraState.DISCONNECTED
        self.capture: Optional[cv2.VideoCapture] = None
        self.frame_number = 0
        self.actual_fps = 0.0
        self.last_frame_time = 0.0
        
        # Threading
        self.frame_queue: queue.Queue = queue.Queue(maxsize=buffer_size)
        self.capture_thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        
        # Statistics
        self.frames_captured = 0
        self.frames_dropped = 0
        self.errors = 0
        
        # Callbacks
        self.on_connect: Optional[Callable] = None
        self.on_disconnect: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
    
    def connect(self) -> bool:
        """Connect to camera"""
        self.state = CameraState.CONNECTING
        source_str = str(self.source).strip()
        
        try:
            # Determine source type
            if source_str.isdigit():
                # USB camera
                idx = int(source_str)
                if os.name == 'nt':
                    self.capture = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                else:
                    self.capture = cv2.VideoCapture(idx)
            else:
                # IP/RTSP camera
                self.capture = cv2.VideoCapture(source_str, cv2.CAP_FFMPEG)
                if not self.capture.isOpened():
                    self.capture = cv2.VideoCapture(source_str)
            
            if not self.capture or not self.capture.isOpened():
                raise RuntimeError(f"Cannot open camera: {source_str}")
            
            # Configure capture properties
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.capture.set(cv2.CAP_PROP_FPS, self.target_fps)
            try:
                self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            except Exception:
                pass
            
            # Wait briefly to allow properties to settle
            time.sleep(0.1)
            ret, frame = self.capture.read()
            if not ret or frame is None:
                raise RuntimeError("Cannot read from camera")
            
            # Get actual properties
            width = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = self.capture.get(cv2.CAP_PROP_FPS)
            self.width = width if width > 0 else self.width
            self.height = height if height > 0 else self.height
            self.actual_fps = fps if fps > 0 else float(self.target_fps)
            self.last_frame_time = time.time()
            self.state = CameraState.CONNECTED
            
            if self.on_connect:
                self.on_connect(self.camera_id)
            
            logger.info(
                f"Camera {self.camera_id} connected: {self.width}x{self.height} @ {self.actual_fps:.2f}fps"
            )
            return True
            
        except Exception as e:
            self.state = CameraState.ERROR
            self.errors += 1
            logger.error(f"Camera {self.camera_id} connection failed: {e}")
            
            if self.on_error:
                self.on_error(self.camera_id, e)
            
            return False
    
    def disconnect(self):
        """Disconnect camera"""
        self.state = CameraState.DISCONNECTED
        
        if self.capture:
            self.capture.release()
            self.capture = None
        
        # Clear queue
        while not self.frame_queue.empty():
            try:
                self.frame_queue.get_nowait()
            except queue.Empty:
                break
        
        if self.on_disconnect:
            self.on_disconnect(self.camera_id)
        
        logger.info(f"Camera {self.camera_id} disconnected")
    
    def start(self) -> bool:
        """Start capture thread"""
        if self.capture_thread and self.capture_thread.is_alive():
            logger.warning(f"Camera {self.camera_id} capture thread already running")
            return True
        
        if not self.connect():
            return False
        
        self.stop_event.clear()
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()
        
        logger.info(f"Camera {self.camera_id} capture started")
        return True
    
    def stop(self):
        """Stop capture thread"""
        self.stop_event.set()
        
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)
            if self.capture_thread.is_alive():
                logger.warning(f"Camera {self.camera_id} capture thread did not stop cleanly")
        
        self.disconnect()
    
    def _capture_loop(self):
        """Main capture loop"""
        consecutive_errors = 0
        
        while not self.stop_event.is_set():
            try:
                if not self.capture or not self.capture.isOpened():
                    consecutive_errors += 1
                    if consecutive_errors >= 3:
                        logger.warning(f"Camera {self.camera_id} disconnected, attempting reconnect...")
                        if self._reconnect():
                            consecutive_errors = 0
                            continue
                        self.stop_event.wait(self.reconnect_delay)
                        continue
                    self.stop_event.wait(0.1)
                    continue
                
                start_time = time.time()
                
                ret, frame = self.capture.read()
                if not ret or frame is None:
                    self.errors += 1
                    consecutive_errors += 1
                    logger.debug(f"Camera {self.camera_id} read failed (attempt {consecutive_errors})")
                    if consecutive_errors >= 3:
                        logger.warning(f"Camera {self.camera_id} lost frames, reconnecting...")
                        if self._reconnect():
                            consecutive_errors = 0
                            continue
                    self.stop_event.wait(0.05)
                    continue
                
                consecutive_errors = 0
                self.frame_number += 1
                
                # Calculate FPS
                current_time = time.time()
                if self.last_frame_time > 0:
                    instant_fps = 1.0 / max((current_time - self.last_frame_time), 1e-6)
                    self.actual_fps = 0.9 * self.actual_fps + 0.1 * instant_fps
                else:
                    self.actual_fps = float(self.target_fps)
                self.last_frame_time = current_time
                
                # Create frame data
                frame_data = FrameData(
                    image=frame,
                    timestamp=current_time,
                    frame_number=self.frame_number,
                    fps=self.actual_fps,
                    camera_id=self.camera_id,
                    latency_ms=(current_time - start_time) * 1000
                )
                
                # Add to queue
                try:
                    self.frame_queue.put_nowait(frame_data)
                    self.frames_captured += 1
                except queue.Full:
                    try:
                        self.frame_queue.get_nowait()
                        self.frame_queue.put_nowait(frame_data)
                        self.frames_dropped += 1
                    except queue.Empty:
                        pass
                
                # Frame rate limiting
                if self.target_fps > 0:
                    elapsed = time.time() - start_time
                    sleep_time = (1.0 / self.target_fps) - elapsed
                    if sleep_time > 0:
                        self.stop_event.wait(sleep_time)
                
            except Exception as e:
                logger.error(f"Capture loop error: {e}")
                self.errors += 1
                consecutive_errors += 1
                self.stop_event.wait(0.1)
    
    def _reconnect(self) -> bool:
        """Attempt to reconnect"""
        self.state = CameraState.RECONNECTING
        
        for attempt in range(self.reconnect_attempts):
            logger.info(f"Reconnect attempt {attempt + 1}/{self.reconnect_attempts}")
            
            self.disconnect()
            
            if self.connect():
                return True
            
            time.sleep(self.reconnect_delay)
        
        self.state = CameraState.ERROR
        logger.error(f"All reconnect attempts failed for camera {self.camera_id}")
        return False
    
    def read(self, timeout: float = 1.0) -> Optional[FrameData]:
        """Read frame from queue"""
        try:
            return self.frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Get camera statistics"""
        return {
            "camera_id": self.camera_id,
            "state": self.state.value,
            "resolution": (self.width, self.height),
            "target_fps": self.target_fps,
            "actual_fps": self.actual_fps,
            "frames_captured": self.frames_captured,
            "frames_dropped": self.frames_dropped,
            "errors": self.errors,
            "queue_size": self.frame_queue.qsize()
        }


class CameraManager:
    """
    Manager for multiple camera sources
    """
    
    def __init__(self):
        self.cameras: Dict[str, CameraSource] = {}
        self.is_running = False
    
    def add_camera(self, camera: CameraSource) -> bool:
        """Add camera to manager"""
        if camera.camera_id in self.cameras:
            logger.warning(f"Camera {camera.camera_id} already exists, replacing")
            self.remove_camera(camera.camera_id)
        
        self.cameras[camera.camera_id] = camera
        logger.info(f"Camera {camera.camera_id} added to manager")
        return True
    
    def remove_camera(self, camera_id: str):
        """Remove camera from manager"""
        if camera_id in self.cameras:
            self.cameras[camera_id].stop()
            del self.cameras[camera_id]
            logger.info(f"Camera {camera_id} removed from manager")
    
    def start_all(self) -> bool:
        """Start all cameras"""
        success = True
        
        for camera_id, camera in self.cameras.items():
            if not camera.start():
                logger.error(f"Failed to start camera {camera_id}")
                success = False
        
        self.is_running = any(
            camera.capture_thread and camera.capture_thread.is_alive()
            for camera in self.cameras.values()
        )
        return success
    
    def stop_all(self):
        """Stop all cameras"""
        for camera in self.cameras.values():
            camera.stop()
        
        self.is_running = False
        logger.info("All cameras stopped")
    
    def read_all(self) -> Dict[str, Optional[FrameData]]:
        """Read frames from all cameras"""
        frames = {}
        
        for camera_id, camera in self.cameras.items():
            frames[camera_id] = camera.read(timeout=0.1)
        
        return frames
    
    def get_camera(self, camera_id: str) -> Optional[CameraSource]:
        """Get camera by ID"""
        return self.cameras.get(camera_id)
    
    def get_stats(self) -> Dict[str, Dict]:
        """Get statistics for all cameras"""
        return {cid: cam.get_stats() for cid, cam in self.cameras.items()}
    
    def get_active_cameras(self) -> List[str]:
        """Get list of active camera IDs"""
        return [
            cid for cid, cam in self.cameras.items()
            if cam.state == CameraState.CONNECTED
        ]
    
    def get_camera_count(self) -> int:
        """Get number of managed cameras"""
        return len(self.cameras)


# Convenience functions
def create_usb_camera(
    camera_id: str,
    device_index: int = 0,
    **kwargs
) -> CameraSource:
    """Create USB camera source"""
    return CameraSource(
        camera_id=camera_id,
        source=str(device_index),
        **kwargs
    )


def create_ip_camera(
    camera_id: str,
    url: str,
    username: Optional[str] = None,
    password: Optional[str] = None,
    **kwargs
) -> CameraSource:
    """Create IP camera source"""
    # Build URL with credentials if provided
    if username and password:
        # Insert credentials into URL
        if "://" in url:
            protocol, rest = url.split("://", 1)
            source = f"{protocol}://{username}:{password}@{rest}"
        else:
            source = url
    else:
        source = url
    
    return CameraSource(
        camera_id=camera_id,
        source=source,
        **kwargs
    )
