import json
from datetime import datetime
from typing import Dict, List, Any

class LessonAnalyticsEngine:
    """
    Ma'lumotlar va Analytics (7-QISM) uchun maxsus tizim.
    Dars davomidagi barcha ma'lumotlarni yig'adi, saqlaydi va hisobotlar tayyorlaydi.
    """
    def __init__(self, session_id: int):
        self.session_id = session_id
        self.start_time = datetime.now()
        self.end_time = None
        self.is_active = True
        
        # O'quvchi keldi/ketdi vaqti ro'yxati
        self.attendance = {} # student_id -> {"arrived": time, "left": time, "status": "present/absent"}
        
        # Dars davomida diqqat grafigi
        self.timeline = [] 
        
        # O'quvchi bo'yicha tarixiy va qiyosiy statistika
        self.student_scores = {} 
        
        # Eng past diqqat momentlari (Screenshot uchun)
        self.low_attention_events = [] 
        
        # O'qituvchiga real vaqtda Avtomatik ogohlantirish (Push notifications)
        self.push_notifications = [] 
        
    def process_realtime_data(self, attention_data: Dict[str, Any]):
        """Kameradan (Yoki Multi-kameradan) kelayotgan har bir JSON ma'lumotni analiz qilish"""
        if not self.is_active:
            return

        now = datetime.now()
        
        # 1. Diqqat grafigi uchun umumiy o'rtacha ballni vaqt bo'yicha saqlash
        self.timeline.append({
            "time": now.isoformat(),
            "avg_attention": attention_data.get("attention", 0)
        })

        # 2. O'quvchi keldi/ketdi qaydlari va individual panellar
        behaviors = attention_data.get("behaviors", [])
        current_active_ids = set()
        
        for idx, b in enumerate(behaviors):
            # FaceRecognition integratsiyasi orqali student_id kelsa, uni oladi, yo'qsa default idx
            student_id = b.get('student_id', f"student_idx_{idx}")
            current_active_ids.add(student_id)
            
            # Keldi/Ketdi qayd etish (Arrival Time)
            if student_id not in self.attendance:
                self.attendance[student_id] = {
                    "arrived": now.isoformat(),
                    "left": None,
                    "status": "present"
                }
            else:
                self.attendance[student_id]["status"] = "present"
                self.attendance[student_id]["left"] = None # Agar darsga qaytib kirsa

            # O'quvchi progressi va ballar tarixi
            if student_id not in self.student_scores:
                self.student_scores[student_id] = []
            
            score = b.get('attention_score', 0)
            self.student_scores[student_id].append(score)

            # 3. Eng past diqqat momentlari va Push Notification (Ogohlantirish)
            # Agar skrinshot signali yongan bo'lsa va ball chindan past bo'lsa
            if b.get('needs_screenshot') and score < 40:
                # Tasodif emasligini tekshirish uchun oxirgi 3 ta kadrni tekshiramiz
                recent_scores = self.student_scores[student_id][-3:]
                if len(recent_scores) == 3 and all(s < 40 for s in recent_scores):
                    event = {
                        "time": now.isoformat(),
                        "student_id": student_id,
                        "score": score,
                        "emotion": b.get("emotion_state", "neutral"),
                        "reason": "Ketma-ket diqqat pasayishi yoki telefon ishlatish",
                        "screenshot_requested": True
                    }
                    self.low_attention_events.append(event)
                    
                    # O'qituvchi paneliga real vaqt ogohlantirish (Push Notification) yuborish
                    self.push_notifications.append({
                        "type": "CRITICAL_WARNING",
                        "message": f"Diqqat: O'quvchi {student_id} chalg'ib qoldi (Ball: {score}%)",
                        "data": event
                    })
                    # Spam bo'lmasligi uchun score tarixini tozalaymiz (keyingi ogohlantirishgacha tanaffus)
                    self.student_scores[student_id] = self.student_scores[student_id][-1:]

        # Darsdan chiqib ketganlarni aniqlash (Departure time)
        for sid in self.attendance:
            if sid not in current_active_ids and self.attendance[sid]["status"] == "present":
                self.attendance[sid]["status"] = "absent"
                self.attendance[sid]["left"] = now.isoformat()

    def get_realtime_dashboard_data(self) -> Dict[str, Any]:
        """O'qituvchiga real vaqt paneli (Dashboard) uchun onlayn ma'lumot"""
        notifications = self.push_notifications.copy()
        self.push_notifications.clear() # O'qituvchiga ketgach, navbatni tozalash
        
        return {
            "active_students_count": len([s for s in self.attendance.values() if s['status'] == 'present']),
            "absent_students_count": len([s for s in self.attendance.values() if s['status'] == 'absent']),
            "notifications": notifications, # Push notifications
            "latest_timeline_data": self.timeline[-5:] if self.timeline else [] # Oxirgi 5 daqiqalik grafik
        }

    def finish_lesson_and_generate_summary(self) -> Dict[str, Any]:
        """Dars oxirida (yoki kun oxirida) to'liq HISOBOT (Summary) yaratish"""
        self.is_active = False
        self.end_time = datetime.now()
        
        # Umumiy diqqat foizi
        if self.timeline:
            overall_attention = sum(t['avg_attention'] for t in self.timeline) / len(self.timeline)
        else:
            overall_attention = 0.0

        # Guruh bo'yicha va Individual statistika hisobi
        student_performance = {}
        for sid, scores in self.student_scores.items():
            if scores:
                avg_score = sum(scores) / len(scores)
                student_performance[sid] = {
                    "average_attention": round(avg_score, 1),
                    "performance_status": "Excellent" if avg_score >= 70 else ("Average" if avg_score >= 40 else "Poor")
                }

        summary = {
            "session_id": self.session_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "duration_minutes": round((self.end_time - self.start_time).total_seconds() / 60, 2),
            "overall_attention_percentage": round(overall_attention, 1),
            "attendance_log": self.attendance,
            "attention_graph_data": self.timeline,
            "low_attention_events": self.low_attention_events,
            "student_performance": student_performance
        }
        
        # Tarixiy ma'lumotlar uchun Baza (DB) ga saqlash logikasi shu yerdan chaqiriladi
        # masalan: db.session.add(AttentionLog(**summary))
        
        return summary
