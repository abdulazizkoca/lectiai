"""
Face Recognition Module
Integrates with face-recognition library for student identification
"""

import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass
import cv2
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class RecognitionResult:
    """Face recognition result"""
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    confidence: float = 0.0
    face_encoding: Optional[np.ndarray] = None


class FaceRecognizer:
    """
    Face recognition using face-recognition library
    """

    def __init__(self, tolerance: float = 0.6):
        self.tolerance = tolerance
        self.known_encodings: List[np.ndarray] = []
        self.known_ids: List[int] = []
        self.known_names: List[str] = []
        self.is_loaded = False

    def load_known_faces(self, faces_data: List[Dict[str, Any]]):
        """
        Load known face encodings from database

        Args:
            faces_data: List of dicts with 'id', 'full_name', 'face_encoding'
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
        logger.info(f"Loaded {len(self.known_encodings)} known faces")

    def recognize_face(self, face_image: np.ndarray) -> RecognitionResult:
        """
        Recognize a face from image

        Args:
            face_image: Cropped face image (RGB)

        Returns:
            RecognitionResult with student info if matched
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
                confidence = 1.0 - min_distance  # Convert distance to confidence
                return RecognitionResult(
                    student_id=self.known_ids[min_distance_idx],
                    student_name=self.known_names[min_distance_idx],
                    confidence=confidence,
                    face_encoding=face_encoding
                )

        except ImportError:
            logger.error("face-recognition library not installed")
        except Exception as e:
            logger.error(f"Face recognition error: {e}")

        return RecognitionResult()

    def register_face(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Generate face encoding for registration

        Args:
            face_image: Cropped face image (RGB)

        Returns:
            Face encoding array or None if failed
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
                return face_encodings[0].tolist()  # Convert to list for JSON storage

        except ImportError:
            logger.error("face-recognition library not installed")
        except Exception as e:
            logger.error(f"Face encoding error: {e}")

        return None