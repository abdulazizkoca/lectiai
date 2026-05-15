"""
Unified Multi-Object Tracking Module
Optimized ByteTrack/DeepSORT hybrid with Kalman filtering and ReID
"""

import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, field
from collections import deque
from enum import Enum, auto
import cv2
from scipy.optimize import linear_sum_assignment
import logging

logger = logging.getLogger(__name__)


class TrackState(Enum):
    """Track lifecycle states"""
    NEW = auto()
    CONFIRMED = auto()
    LOST = auto()
    DELETED = auto()


@dataclass
class Track:
    """Unified track representation"""
    track_id: int
    bbox: Tuple[int, int, int, int]
    centroid: Tuple[float, float]
    confidence: float = 0.0
    
    # State
    state: TrackState = TrackState.NEW
    hits: int = 0
    misses: int = 0
    age: int = 0
    
    # Motion
    velocity: Tuple[float, float] = (0.0, 0.0)
    kalman_state: np.ndarray = field(default_factory=lambda: np.zeros(4))
    
    # Appearance
    embedding: Optional[np.ndarray] = None
    embedding_history: deque = field(default_factory=lambda: deque(maxlen=50))
    
    # History
    bbox_history: deque = field(default_factory=lambda: deque(maxlen=100))
    centroid_history: deque = field(default_factory=lambda: deque(maxlen=100))
    confidence_history: deque = field(default_factory=lambda: deque(maxlen=30))
    
    # Metadata
    face_id: Optional[int] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    recognition_confidence: float = 0.0
    is_occluded: bool = False
    occlusion_count: int = 0
    
    def update(self, bbox: Tuple[int, int, int, int], confidence: float, 
               embedding: Optional[np.ndarray] = None):
        """Update track with new detection"""
        # Calculate new centroid
        new_centroid = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
        
        # Calculate velocity
        if len(self.centroid_history) > 0:
            prev_centroid = self.centroid_history[-1]
            self.velocity = (
                new_centroid[0] - prev_centroid[0],
                new_centroid[1] - prev_centroid[1]
            )
        
        # Update state
        self.bbox = bbox
        self.centroid = new_centroid
        self.confidence = confidence
        self.hits += 1
        self.misses = 0
        self.age += 1
        self.is_occluded = False
        
        if self.hits >= 3:
            self.state = TrackState.CONFIRMED
        
        # Update history
        self.bbox_history.append(bbox)
        self.centroid_history.append(new_centroid)
        self.confidence_history.append(confidence)
        
        # Update embedding
        if embedding is not None:
            self.embedding = embedding
            self.embedding_history.append(embedding)
            
            # Update face embedding (moving average)
            if len(self.embedding_history) > 1:
                weights = np.linspace(0.5, 1.0, len(self.embedding_history))
                weights /= weights.sum()
                self.embedding = np.average(
                    self.embedding_history, 
                    axis=0, 
                    weights=weights
                )
    
    def predict(self) -> Tuple[float, float]:
        """Predict next position using motion model"""
        if len(self.centroid_history) >= 3:
            # Use velocity for prediction
            predicted_x = self.centroid[0] + self.velocity[0]
            predicted_y = self.centroid[1] + self.velocity[1]
            return (predicted_x, predicted_y)
        return self.centroid
    
    def mark_missed(self):
        """Mark track as missed this frame"""
        self.misses += 1
        self.age += 1
        
        if self.misses > 5:
            self.is_occluded = True
            self.occlusion_count += 1
        
        if self.misses > 30:
            self.state = TrackState.LOST
    
    def is_deleted(self, max_age: int = 30) -> bool:
        """Check if track should be deleted"""
        return self.misses > max_age
    
    def get_smoothed_bbox(self, window: int = 5) -> Tuple[int, int, int, int]:
        """Get time-averaged bounding box for stability"""
        if len(self.bbox_history) < window:
            return self.bbox
        
        recent_boxes = list(self.bbox_history)[-window:]
        x1 = int(np.mean([b[0] for b in recent_boxes]))
        y1 = int(np.mean([b[1] for b in recent_boxes]))
        x2 = int(np.mean([b[2] for b in recent_boxes]))
        y2 = int(np.mean([b[3] for b in recent_boxes]))
        
        return (x1, y1, x2, y2)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "track_id": self.track_id,
            "bbox": self.bbox,
            "centroid": self.centroid,
            "confidence": self.confidence,
            "state": self.state.name,
            "hits": self.hits,
            "misses": self.misses,
            "velocity": self.velocity,
            "face_id": self.face_id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "recognition_confidence": self.recognition_confidence,
            "is_occluded": self.is_occluded
        }


class MultiObjectTracker:
    """
    Unified multi-object tracker with ByteTrack-style association
    and DeepSORT-style appearance features
    """
    
    def __init__(
        self,
        max_age: int = 30,
        min_hits: int = 3,
        iou_threshold: float = 0.3,
        similarity_threshold: float = 0.6,
        use_appearance: bool = True,
        use_motion_prediction: bool = True
    ):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.similarity_threshold = similarity_threshold
        self.use_appearance = use_appearance
        self.use_motion_prediction = use_motion_prediction
        
        # Tracks
        self.tracks: Dict[int, Track] = {}
        self.lost_tracks: Dict[int, Track] = {}
        self.next_track_id = 1
        
        # ReID database for lost track recovery
        self.reid_database: Dict[int, np.ndarray] = {}
        
        # Statistics
        self.total_tracks = 0
        self.id_switches = 0
        
    def update(self, detections: List[Any], embeddings: Optional[List[np.ndarray]] = None) -> List[Track]:
        """
        Update tracker with new detections
        
        Args:
            detections: List of detection objects with bbox and confidence
            embeddings: Optional face embeddings
            
        Returns:
            List of confirmed active tracks
        """
        # Extract detection data
        det_bboxes = []
        det_confidences = []
        det_embeddings = embeddings if embeddings else [None] * len(detections)
        
        for det in detections:
            if hasattr(det, 'bbox'):
                det_bboxes.append(det.bbox)
                det_confidences.append(det.confidence if hasattr(det, 'confidence') else 0.5)
            else:
                det_bboxes.append(det)
                det_confidences.append(0.5)
        
        # Predict existing tracks
        for track in list(self.tracks.values()):
            if self.use_motion_prediction:
                track.predict()
        
        # Separate tracks by state
        confirmed_tracks = [t for t in self.tracks.values() if t.state == TrackState.CONFIRMED]
        unconfirmed_tracks = [t for t in self.tracks.values() if t.state == TrackState.NEW]
        
        # Associate detections with tracks
        # Step 1: Match high-confidence detections with confirmed tracks
        matched, unmatched_dets, unmatched_tracks = self._associate(
            confirmed_tracks, 
            det_bboxes, 
            det_embeddings,
            use_appearance=True
        )
        
        # Update matched tracks
        for det_idx, track_id in matched.items():
            self.tracks[track_id].update(
                det_bboxes[det_idx],
                det_confidences[det_idx],
                det_embeddings[det_idx]
            )
        
        # Step 2: Match remaining with unconfirmed tracks
        if unmatched_dets and unconfirmed_tracks:
            remaining_dets = [det_bboxes[i] for i in unmatched_dets]
            remaining_embs = [det_embeddings[i] for i in unmatched_dets]
            
            matched2, unmatched_dets2, _ = self._associate(
                unconfirmed_tracks,
                remaining_dets,
                remaining_embs,
                use_appearance=True
            )
            
            for det_idx, track_id in matched2.items():
                original_idx = unmatched_dets[det_idx]
                self.tracks[track_id].update(
                    det_bboxes[original_idx],
                    det_confidences[original_idx],
                    det_embeddings[original_idx]
                )
            
            unmatched_dets = [unmatched_dets[i] for i in unmatched_dets2]
        
        # Step 3: Try to recover lost tracks with unmatched detections
        for det_idx in unmatched_dets:
            bbox = det_bboxes[det_idx]
            embedding = det_embeddings[det_idx]
            
            # Try re-identification
            recovered_id = self._try_recover_track(bbox, embedding)
            
            if recovered_id is not None and recovered_id in self.lost_tracks:
                # Recover lost track
                track = self.lost_tracks.pop(recovered_id)
                track.state = TrackState.CONFIRMED
                track.is_occluded = False
                track.occlusion_count = 0
                track.misses = 0
                track.update(bbox, det_confidences[det_idx], embedding)
                self.tracks[recovered_id] = track
            else:
                # Create new track
                track_id = self._create_track_id()
                new_track = Track(
                    track_id=track_id,
                    bbox=bbox,
                    centroid=((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2),
                    confidence=det_confidences[det_idx],
                    embedding=embedding
                )
                new_track.hits = 1
                self.tracks[track_id] = new_track
                self.total_tracks += 1
        
        # Mark unmatched tracks as missed
        for track_id in unmatched_tracks:
            if track_id in self.tracks:
                self.tracks[track_id].mark_missed()
        
        # Move lost tracks to lost_tracks dict
        tracks_to_move = []
        for track_id, track in self.tracks.items():
            if track.is_deleted(self.max_age):
                tracks_to_move.append(track_id)
                # Save embedding for potential recovery
                if track.embedding is not None:
                    self.reid_database[track_id] = track.embedding
        
        for track_id in tracks_to_move:
            track = self.tracks.pop(track_id)
            track.state = TrackState.LOST
            self.lost_tracks[track_id] = track
        
        # Clean old lost tracks
        self._clean_lost_tracks()
        
        # Return confirmed active tracks
        return [t for t in self.tracks.values() if t.state == TrackState.CONFIRMED]
    
    def _associate(
        self,
        tracks: List[Track],
        detections: List[Tuple[int, int, int, int]],
        embeddings: List[Optional[np.ndarray]],
        use_appearance: bool = True
    ) -> Tuple[Dict[int, int], List[int], List[int]]:
        """
        Associate detections with tracks using Hungarian algorithm
        
        Returns:
            (matched_pairs, unmatched_detections, unmatched_tracks)
        """
        if len(tracks) == 0:
            return {}, list(range(len(detections))), []
        
        if len(detections) == 0:
            return {}, [], [t.track_id for t in tracks]
        
        # Compute cost matrix
        cost_matrix = np.zeros((len(tracks), len(detections)))
        
        for i, track in enumerate(tracks):
            for j, (det_bbox, det_emb) in enumerate(zip(detections, embeddings)):
                # IoU cost
                iou = self._compute_iou(track.bbox, det_bbox)
                iou_cost = 1 - iou
                
                # Distance cost
                det_centroid = ((det_bbox[0] + det_bbox[2]) / 2, (det_bbox[1] + det_bbox[3]) / 2)
                dist = np.sqrt((track.centroid[0] - det_centroid[0])**2 + 
                              (track.centroid[1] - det_centroid[1])**2)
                dist_cost = min(dist / 100.0, 1.0)
                
                # Appearance cost
                appearance_cost = 0.0
                if use_appearance and self.use_appearance:
                    if track.embedding is not None and det_emb is not None:
                        similarity = np.dot(track.embedding, det_emb) / (
                            np.linalg.norm(track.embedding) * np.linalg.norm(det_emb) + 1e-6
                        )
                        appearance_cost = 1 - similarity
                
                # Combined cost
                cost_matrix[i, j] = 0.5 * iou_cost + 0.3 * dist_cost + 0.2 * appearance_cost
        
        # Hungarian algorithm
        row_indices, col_indices = linear_sum_assignment(cost_matrix)
        
        # Filter by threshold
        matched = {}
        for row, col in zip(row_indices, col_indices):
            if cost_matrix[row, col] < 0.7:  # Overall threshold
                matched[col] = tracks[row].track_id
        
        # Find unmatched
        matched_dets = set(matched.keys())
        matched_tracks = set(matched.values())
        
        unmatched_dets = [i for i in range(len(detections)) if i not in matched_dets]
        unmatched_tracks = [t.track_id for t in tracks if t.track_id not in matched_tracks]
        
        return matched, unmatched_dets, unmatched_tracks
    
    def _try_recover_track(
        self,
        bbox: Tuple[int, int, int, int],
        embedding: Optional[np.ndarray]
    ) -> Optional[int]:
        """Try to recover a lost track using ReID"""
        if embedding is None or len(self.reid_database) == 0:
            return None
        
        best_match = None
        best_similarity = 0.0
        
        for track_id, db_embedding in self.reid_database.items():
            if track_id in self.lost_tracks:
                similarity = np.dot(embedding, db_embedding) / (
                    np.linalg.norm(embedding) * np.linalg.norm(db_embedding) + 1e-6
                )
                
                if similarity > best_similarity and similarity > self.similarity_threshold:
                    best_similarity = similarity
                    best_match = track_id
        
        return best_match
    
    def _compute_iou(
        self,
        bbox1: Tuple[int, int, int, int],
        bbox2: Tuple[int, int, int, int]
    ) -> float:
        """Compute Intersection over Union"""
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        xi1 = max(x1_1, x1_2)
        yi1 = max(y1_1, y1_2)
        xi2 = min(x2_1, x2_2)
        yi2 = min(y2_1, y2_2)
        
        if xi2 <= xi1 or yi2 <= yi1:
            return 0.0
        
        inter_area = (xi2 - xi1) * (yi2 - yi1)
        box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
        box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
        
        return inter_area / (box1_area + box2_area - inter_area + 1e-6)
    
    def _create_track_id(self) -> int:
        """Generate new unique track ID"""
        track_id = self.next_track_id
        self.next_track_id += 1
        return track_id
    
    def _clean_lost_tracks(self):
        """Remove old lost tracks"""
        to_remove = []
        for track_id, track in self.lost_tracks.items():
            if track.age > self.max_age * 2:
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.lost_tracks[track_id]
            if track_id in self.reid_database:
                del self.reid_database[track_id]
    
    def get_track(self, track_id: int) -> Optional[Track]:
        """Get track by ID"""
        return self.tracks.get(track_id)
    
    def get_active_tracks(self) -> List[Track]:
        """Get all active confirmed tracks"""
        return [t for t in self.tracks.values() if t.state == TrackState.CONFIRMED]
    
    def get_all_tracks(self) -> List[Track]:
        """Get all tracks including lost"""
        return list(self.tracks.values()) + list(self.lost_tracks.values())
    
    def get_stats(self) -> Dict[str, Any]:
        """Get tracker statistics"""
        return {
            "active_tracks": len([t for t in self.tracks.values() if t.state == TrackState.CONFIRMED]),
            "total_tracks": len(self.tracks),
            "lost_tracks": len(self.lost_tracks),
            "total_created": self.total_tracks,
            "next_id": self.next_track_id,
            "reid_database_size": len(self.reid_database)
        }
    
    def reset(self):
        """Reset tracker state"""
        self.tracks.clear()
        self.lost_tracks.clear()
        self.reid_database.clear()
        self.next_track_id = 1
        self.total_tracks = 0
        logger.info("Tracker reset")
