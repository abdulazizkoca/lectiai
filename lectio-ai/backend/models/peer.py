from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class PeerQuestion(Base):
    __tablename__ = "peer_questions"

    id = Column(Integer, primary_key=True, index=True)
    asker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    upvotes = Column(Integer, default=0)
    is_answered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    asker = relationship("User", backref="asked_questions")
    answers = relationship("PeerAnswer", back_populates="question")


class PeerAnswer(Base):
    __tablename__ = "peer_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("peer_questions.id"), nullable=False)
    answerer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answer = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0)
    is_accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("PeerQuestion", back_populates="answers")
    answerer = relationship("User", backref="given_answers")
