"""
Face Recognition Router
Handles face registration and recognition for students
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from services.camera_service import FaceRecognitionService
from pydantic import BaseModel
from typing import List, Optional
import base64
import cv2
import numpy as np

router = APIRouter(prefix="/face-recognition", tags=["face-recognition"])


class FaceRegistrationRequest(BaseModel):
    user_id: int
    image_data: str  # Base64 encoded image


class FaceRecognitionResponse(BaseModel):
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    confidence: float = 0.0


class KnownFacesResponse(BaseModel):
    faces: List[dict]


@router.post("/register", response_model=dict)
async def register_face(
    request: FaceRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Register a student's face for recognition
    """
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Decode base64 image
    try:
        image_data = base64.b64decode(request.image_data)
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    # Generate face encoding
    service = FaceRecognitionService()
    encoding = service.register_face(frame)

    if encoding is None:
        raise HTTPException(status_code=400, detail="No face detected in image")

    # Save encoding to database
    user.face_encoding = encoding
    db.commit()

    return {"message": "Face registered successfully", "user_id": user.id}


@router.post("/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Recognize faces in uploaded image
    """
    # Read image
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Load known faces
    users = db.query(User).filter(
        User.face_encoding.isnot(None),
        User.role == "student"
    ).all()

    known_faces = []
    for user in users:
        known_faces.append({
            "id": user.id,
            "full_name": user.full_name,
            "face_encoding": user.face_encoding
        })

    # Recognize
    service = FaceRecognitionService()
    service.load_known_faces(known_faces)
    result = service.recognize_face(frame)

    return FaceRecognitionResponse(
        student_id=result.student_id,
        student_name=result.student_name,
        confidence=result.confidence
    )


@router.get("/known-faces", response_model=KnownFacesResponse)
async def get_known_faces(db: Session = Depends(get_db)):
    """
    Get all registered faces for recognition
    """
    users = db.query(User).filter(
        User.face_encoding.isnot(None)
    ).all()

    faces = []
    for user in users:
        faces.append({
            "id": user.id,
            "full_name": user.full_name,
            "face_encoding": user.face_encoding
        })

    return KnownFacesResponse(faces=faces)