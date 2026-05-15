"""
Unified Rendering Module
Modern overlay UI with student labels, analytics, and heatmaps
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from collections import deque
import time
import logging

from .config import RenderConfig, get_config
from .detection import DetectionResult
from .tracking import Track
from .pipeline import ProcessingResult

logger = logging.getLogger(__name__)


@dataclass
class StudentLabel:
    """Student label data for rendering"""
    track_id: int
    bbox: Tuple[int, int, int, int]
    name: Optional[str] = None
    confidence: float = 0.0
    attention_score: float = 0.5
    is_looking_at_screen: bool = True
    is_distracted: bool = False
    is_occluded: bool = False
    emotion: Optional[str] = None


class OverlayRenderer:
    """
    Modern UI overlay renderer
    
    Features:
    - Clean modern design
    - Student bounding boxes with labels
    - Attention indicators
    - Real-time analytics panel
    - FPS counter
    """
    
    def __init__(self, config: Optional[RenderConfig] = None):
        self.config = config or get_config().render
        
        # Color schemes
        self.colors = self._load_color_scheme(self.config.theme)
        
        # Font settings
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        
        # Performance tracking
        self.fps_history = deque(maxlen=30)
        self.last_render_time = time.time()
        
        # Analytics history
        self.attention_history = deque(maxlen=100)
        self.student_count_history = deque(maxlen=100)
    
    def _load_color_scheme(self, theme: str) -> Dict[str, Tuple[int, int, int]]:
        """Load color scheme for theme"""
        schemes = {
            "dark": {
                "background": (30, 30, 30),
                "text": (255, 255, 255),
                "text_secondary": (180, 180, 180),
                "primary": (0, 255, 128),      # Green
                "warning": (0, 200, 255),      # Yellow
                "danger": (0, 0, 255),         # Red
                "info": (255, 200, 0),         # Cyan
                "accent": (200, 100, 255),     # Purple
                "border": (60, 60, 60)
            },
            "light": {
                "background": (240, 240, 240),
                "text": (30, 30, 30),
                "text_secondary": (100, 100, 100),
                "primary": (0, 150, 100),
                "warning": (0, 150, 200),
                "danger": (200, 50, 50),
                "info": (200, 150, 0),
                "accent": (150, 50, 200),
                "border": (200, 200, 200)
            },
            "cyber": {
                "background": (10, 0, 20),
                "text": (0, 255, 255),
                "text_secondary": (0, 150, 150),
                "primary": (0, 255, 128),
                "warning": (255, 200, 0),
                "danger": (0, 0, 255),
                "info": (255, 0, 255),
                "accent": (255, 100, 200),
                "border": (50, 0, 100)
            }
        }
        return schemes.get(theme, schemes["dark"])
    
    def render(self, result: ProcessingResult, fps: float = 0.0) -> np.ndarray:
        """
        Render complete overlay on processing result
        
        Args:
            result: Processing result with frame and tracks
            fps: Current FPS
            
        Returns:
            Rendered frame
        """
        frame = result.frame.copy()
        h, w = frame.shape[:2]
        
        # Update history
        self.attention_history.append(result.avg_attention)
        self.student_count_history.append(result.student_count)
        
        # 1. Draw student boxes and labels
        if self.config.show_labels:
            for track in result.tracks:
                label = self._create_student_label(track)
                frame = self._draw_student_box(frame, label)
            frame = self._draw_face_keypoints(frame, result.detections)
        
        # 2. Draw header with FPS
        frame = self._draw_header(frame, fps, result)
        
        # 3. Draw analytics panel
        if self.config.show_analytics:
            frame = self._draw_analytics_panel(frame, result)
        
        # 4. Draw debug info
        if self.config.show_debug:
            frame = self._draw_debug_info(frame, result)
        
        return frame
    
    def _create_student_label(self, track: Track) -> StudentLabel:
        """Create student label from track"""
        # Calculate attention score
        if track.is_occluded:
            attention = 0.3
        elif track.state.value == "confirmed":
            attention = min(1.0, track.hits / 10)
        else:
            attention = 0.5
        
        return StudentLabel(
            track_id=track.track_id,
            bbox=track.get_smoothed_bbox(),
            name=f"Student {track.track_id}",
            confidence=track.confidence,
            attention_score=attention,
            is_looking_at_screen=attention > 0.6,
            is_distracted=attention < 0.4,
            is_occluded=track.is_occluded
        )
    
    def _draw_student_box(
        self,
        frame: np.ndarray,
        label: StudentLabel
    ) -> np.ndarray:
        """Draw enhanced student bounding box with clear marker and real-time info"""
        x1, y1, x2, y2 = label.bbox
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        
        # Determine color based on attention state
        if label.is_distracted:
            color = self.colors["danger"]  # Red
            status = "⚠ Diqqatsiz"
        elif label.is_occluded:
            color = self.colors["warning"]  # Yellow
            status = "? Yashirin"
        elif not label.is_looking_at_screen:
            color = self.colors["info"]  # Blue
            status = "← Boshqa joy"
        elif label.attention_score > 0.7:
            color = self.colors["primary"]  # Green
            status = "✓ Faol"
        elif label.attention_score > 0.4:
            color = self.colors["warning"]  # Yellow
            status = "~ O'rtacha"
        else:
            color = self.colors["danger"]  # Red
            status = "✗ Passiv"
        
        # Draw main bounding box with thicker border
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
        
        # Draw corner markers for better visibility
        corner_len = 20
        # Top-left
        cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, 3)
        cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, 3)
        # Top-right
        cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, 3)
        cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, 3)
        # Bottom-left
        cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, 3)
        cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, 3)
        # Bottom-right
        cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, 3)
        cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, 3)
        
        # Draw center marker (tracking point)
        cv2.circle(frame, (cx, cy), 5, color, -1)
        cv2.circle(frame, (cx, cy), 8, color, 2)
        
        # Create label with student ID badge
        label_text = f"#{label.track_id}"
        status_text = status
        attention_text = f"Diqqat: {label.attention_score:.0%}"
        conf_text = f"Aniqlik: {label.confidence:.0%}"
        
        # Calculate label dimensions
        lines = [label_text, status_text, attention_text, conf_text]
        max_width = 0
        line_height = 20
        for line in lines:
            (text_w, _), _ = cv2.getTextSize(line, self.font, 0.5, 1)
            max_width = max(max_width, text_w)
        
        label_w = max(max_width + 15, 120)
        label_h = len(lines) * line_height + 10
        
        # Label position (above box, centered)
        label_x = max(min(cx - label_w // 2, frame.shape[1] - label_w - 5), 5)
        label_y = max(y1 - label_h - 8, 5)
        
        # Draw label background with rounded effect
        overlay = frame.copy()
        cv2.rectangle(
            overlay,
            (label_x, label_y),
            (label_x + label_w, label_y + label_h),
            self.colors["background"],
            -1
        )
        cv2.rectangle(
            overlay,
            (label_x, label_y),
            (label_x + label_w, label_y + label_h),
            color,
            2
        )
        frame = cv2.addWeighted(
            frame, 1 - self.config.overlay_alpha,
            overlay, self.config.overlay_alpha, 0
        )
        
        # Draw student ID badge at top
        id_w = 50
        id_h = 22
        id_x = label_x
        id_y = label_y
        cv2.rectangle(frame, (id_x, id_y), (id_x + id_w, id_y + id_h), color, -1)
        cv2.putText(
            frame,
            f"ID:{label.track_id}",
            (id_x + 5, id_y + 16),
            self.font,
            0.55,
            (0, 0, 0),
            2,
            cv2.LINE_AA
        )
        
        # Draw status and info lines
        text_x = label_x + 5
        text_y = label_y + id_h + 18
        
        # Status line with color
        cv2.putText(
            frame,
            status_text,
            (text_x, text_y),
            self.font,
            0.5,
            color,
            2,
            cv2.LINE_AA
        )
        
        # Attention percentage
        text_y += line_height
        cv2.putText(
            frame,
            attention_text,
            (text_x, text_y),
            self.font,
            0.45,
            self.colors["text"],
            1,
            cv2.LINE_AA
        )
        
        # Confidence
        text_y += line_height
        cv2.putText(
            frame,
            conf_text,
            (text_x, text_y),
            self.font,
            0.45,
            self.colors["text_secondary"],
            1,
            cv2.LINE_AA
        )
        
        # Draw attention bar at bottom of box
        bar_margin = 3
        bar_width = x2 - x1 - 2 * bar_margin
        bar_height = 6
        bar_x = x1 + bar_margin
        bar_y = y2 + bar_margin
        
        # Bar background
        cv2.rectangle(
            frame,
            (bar_x, bar_y),
            (bar_x + bar_width, bar_y + bar_height),
            (40, 40, 40),
            -1
        )
        
        # Bar fill with attention level
        fill_width = int(bar_width * label.attention_score)
        if fill_width > 0:
            cv2.rectangle(
                frame,
                (bar_x, bar_y),
                (bar_x + fill_width, bar_y + bar_height),
                color,
                -1
            )
        
        # Draw small indicator dot if tracking is active
        indicator_x = x2 - 10
        indicator_y = y1 + 10
        if label.is_looking_at_screen:
            cv2.circle(frame, (indicator_x, indicator_y), 4, self.colors["primary"], -1)
            cv2.circle(frame, (indicator_x, indicator_y), 6, self.colors["primary"], 1)
        else:
            cv2.circle(frame, (indicator_x, indicator_y), 4, self.colors["danger"], -1)
        
        return frame
    
    def _draw_face_keypoints(
        self,
        frame: np.ndarray,
        detections: List[DetectionResult]
    ) -> np.ndarray:
        """Draw face landmarks and motion points for each detection"""
        if not detections:
            return frame

        for det in detections:
            if det.keypoints is None:
                continue
            pts = np.asarray(det.keypoints)
            if pts.ndim != 2 or pts.shape[1] != 2:
                continue

            color = self.colors["accent"]
            for idx, (x, y) in enumerate(pts.astype(int)):
                cv2.circle(frame, (x, y), 3, (255, 255, 255), -1)
                cv2.circle(frame, (x, y), 5, color, 1)
                if idx == 0:
                    cv2.putText(
                        frame,
                        f"P{idx+1}",
                        (x + 4, y - 4),
                        self.font,
                        0.35,
                        self.colors["text"],
                        1,
                        cv2.LINE_AA
                    )

            # Connect the first points where appropriate for a better landmark overlay
            if pts.shape[0] >= 5:
                pairs = [(0, 1), (1, 2), (2, 3), (3, 4)]
                for start, end in pairs:
                    pt1 = tuple(pts[start].astype(int))
                    pt2 = tuple(pts[end].astype(int))
                    cv2.line(frame, pt1, pt2, self.colors["info"], 1)
        
        return frame
    
    def _draw_header(
        self,
        frame: np.ndarray,
        fps: float,
        result: ProcessingResult
    ) -> np.ndarray:
        """Draw header bar with FPS and status in Uzbek"""
        h, w = frame.shape[:2]
        header_height = 50
        
        # Background
        overlay = frame.copy()
        cv2.rectangle(
            overlay,
            (0, 0),
            (w, header_height),
            self.colors["background"],
            -1
        )
        frame = cv2.addWeighted(
            frame, 1 - self.config.overlay_alpha,
            overlay, self.config.overlay_alpha, 0
        )
        
        # Border
        cv2.line(
            frame,
            (0, header_height),
            (w, header_height),
            self.colors["accent"],
            2
        )
        
        # FPS indicator with color coding
        fps_color = (
            self.colors["primary"] if fps >= 25
            else self.colors["warning"] if fps >= 15
            else self.colors["danger"]
        )
        cv2.putText(
            frame,
            f"FPS: {fps:.1f}",
            (10, 32),
            self.font,
            0.65,
            fps_color,
            2,
            cv2.LINE_AA
        )
        
        # Student count with icon-like indicator
        active_count = sum(1 for t in result.tracks if t.hits >= 3)
        cv2.putText(
            frame,
            f"Talabalar: {result.student_count} ({active_count} faol)",
            (150, 32),
            self.font,
            0.6,
            self.colors["text"],
            2,
            cv2.LINE_AA
        )
        
        # Title with current time
        from datetime import datetime
        current_time = datetime.now().strftime("%H:%M:%S")
        title_x = w // 2 - 80
        cv2.putText(
            frame,
            "LECTIO AI",
            (title_x, 32),
            self.font,
            0.75,
            self.colors["accent"],
            2,
            cv2.LINE_AA
        )
        
        # Time on right side
        cv2.putText(
            frame,
            current_time,
            (w - 100, 32),
            self.font,
            0.6,
            self.colors["text_secondary"],
            1,
            cv2.LINE_AA
        )
        
        return frame
    
    def _draw_analytics_panel(
        self,
        frame: np.ndarray,
        result: ProcessingResult
    ) -> np.ndarray:
        """Draw analytics panel on right side"""
        h, w = frame.shape[:2]
        panel_width = 250
        panel_x = w - panel_width
        
        # Panel background
        overlay = frame.copy()
        cv2.rectangle(
            overlay,
            (panel_x, 0),
            (w, h),
            self.colors["background"],
            -1
        )
        frame = cv2.addWeighted(
            frame, 1 - self.config.overlay_alpha * 0.5,
            overlay, self.config.overlay_alpha * 0.5, 0
        )
        
        # Border
        cv2.line(
            frame,
            (panel_x, 0),
            (panel_x, h),
            self.colors["border"],
            2
        )
        
        # Title
        y_offset = 30
        cv2.putText(
            frame,
            "ANALYTICS",
            (panel_x + 10, y_offset),
            self.font,
            0.6,
            self.colors["accent"],
            2,
            cv2.LINE_AA
        )
        
        # Student stats
        y_offset += 40
        total = result.student_count
        attentive = sum(1 for t in result.tracks if t.hits >= 3)
        distracted = result.distracted_count
        
        stats = [
            ("Total", total, self.colors["text"]),
            ("Attentive", attentive, self.colors["primary"]),
            ("Distracted", distracted, self.colors["danger"])
        ]
        
        for label, value, color in stats:
            cv2.putText(
                frame,
                f"{label}: {value}",
                (panel_x + 10, y_offset),
                self.font,
                0.5,
                color,
                1,
                cv2.LINE_AA
            )
            y_offset += 25
        
        # Average attention
        y_offset += 20
        cv2.putText(
            frame,
            "Avg Attention:",
            (panel_x + 10, y_offset),
            self.font,
            0.5,
            self.colors["text_secondary"],
            1,
            cv2.LINE_AA
        )
        
        y_offset += 25
        bar_width = panel_width - 20
        bar_height = 15
        
        cv2.rectangle(
            frame,
            (panel_x + 10, y_offset),
            (panel_x + 10 + bar_width, y_offset + bar_height),
            (50, 50, 50),
            -1
        )
        
        fill_width = int(bar_width * result.avg_attention)
        
        if result.avg_attention > 0.7:
            bar_color = self.colors["primary"]
        elif result.avg_attention > 0.4:
            bar_color = self.colors["warning"]
        else:
            bar_color = self.colors["danger"]
        
        cv2.rectangle(
            frame,
            (panel_x + 10, y_offset),
            (panel_x + 10 + fill_width, y_offset + bar_height),
            bar_color,
            -1
        )
        
        # Percentage
        text = f"{result.avg_attention:.0%}"
        (text_w, _), _ = cv2.getTextSize(text, self.font, 0.5, 1)
        cv2.putText(
            frame,
            text,
            (panel_x + 10 + (bar_width - text_w) // 2, y_offset + 12),
            self.font,
            0.5,
            self.colors["text"],
            1,
            cv2.LINE_AA
        )
        
        # Processing time
        y_offset += 40
        cv2.putText(
            frame,
            f"Process: {result.processing_time_ms:.1f}ms",
            (panel_x + 10, y_offset),
            self.font,
            0.4,
            self.colors["text_secondary"],
            1,
            cv2.LINE_AA
        )
        
        return frame
    
    def _draw_debug_info(
        self,
        frame: np.ndarray,
        result: ProcessingResult
    ) -> np.ndarray:
        """Draw debug information"""
        debug_lines = [
            f"Camera: {result.camera_id}",
            f"Timestamp: {result.timestamp:.3f}",
            f"Detections: {len(result.detections)}",
            f"Tracks: {len(result.tracks)}",
            f"Stage times:"
        ]
        
        for stage, t in result.stage_times.items():
            debug_lines.append(f"  {stage}: {t:.1f}ms")
        
        y = 70
        for line in debug_lines:
            cv2.putText(
                frame,
                line,
                (10, y),
                self.font,
                0.35,
                self.colors["text_secondary"],
                1
            )
            y += 15
        
        return frame
    
    def set_theme(self, theme: str):
        """Change color theme"""
        self.config.theme = theme
        self.colors = self._load_color_scheme(theme)


# Convenience function
def render_frame(
    frame: np.ndarray,
    tracks: List[Track],
    fps: float = 0.0,
    config: Optional[RenderConfig] = None
) -> np.ndarray:
    """Quick render function for simple use cases"""
    result = ProcessingResult(
        camera_id="main",
        frame=frame,
        timestamp=time.time(),
        tracks=tracks,
        student_count=len(tracks)
    )
    
    renderer = OverlayRenderer(config)
    return renderer.render(result, fps)
